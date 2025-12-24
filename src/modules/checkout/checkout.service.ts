import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import {
    Order,
    OrderItems,
    OrderItemIngredient,
    Carts,
    CartItems,
    CartItemsIngredient,

} from '@/models';
import { ORDERSTATUS, PAYMENTMETHOD, PAYMENTSTATUS } from '@/models/order.model';
import { CartPreviewService } from '../cart-preview/cart-preview.service';
import { RedisService } from '../redis/redis.service';
import { CheckoutConfirmDto } from './dto/checkout-confirm.dto';
import { SepayService } from '../sepay/sepay.service';
import { Op } from 'sequelize';

@Injectable()
export class CheckoutService {
    private readonly logger = new Logger(CheckoutService.name);

    constructor(
        @InjectModel(Order) private orderModel: typeof Order,
        @InjectModel(OrderItems) private orderItemsModel: typeof OrderItems,
        @InjectModel(OrderItemIngredient) private orderItemIngredientModel: typeof OrderItemIngredient,
        @InjectModel(Carts) private cartsModel: typeof Carts,
        @InjectModel(CartItems) private cartItemsModel: typeof CartItems,
        @InjectModel(CartItemsIngredient) private cartItemsIngredientModel: typeof CartItemsIngredient,
        private readonly cartPreviewService: CartPreviewService,
        private readonly redisService: RedisService,
        private readonly sepayService: SepayService,
        private readonly sequelize: Sequelize
    ) { }

    async confirmCheckout(userId: number, cartId: number, dto: CheckoutConfirmDto) {
        let transaction = await this.sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
        });
        let createdOrder: Order;

        try {
            // ⭐ BƯỚC 1: START TRANSACTION


            this.logger.log(`Starting checkout for user ${userId}, cart ${cartId}`);

            // ⭐ BƯỚC 2: LOCK CART (FOR UPDATE)
            const cart = await this.cartsModel.findOne({
                where: { id: cartId, userId },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!cart) {
                throw new BadRequestException('Cart not found or already checked out');
            }

            // ⭐ BƯỚC 3: RE-CALCULATE TOTALS
            const calculation = await this.cartPreviewService.checkoutCaculate(
                userId,
                cartId,
                {
                    cartItemId: dto.cartItemIds,
                    addressId: dto.addressId,
                    temporaryAddress: dto.temporaryAddress as any,
                    couponCode: dto.couponCode
                },
            );

            if (!calculation || !calculation.data) {
                throw new BadRequestException('Failed to calculate order totals');
            }

            // ⭐ BƯỚC 4: CREATE ORDER
            const orderNumber = `ORD${Date.now()}`;

            this.logger.log(`Creating order: ${orderNumber}`);

            createdOrder = await this.orderModel.create({
                orderNumber,
                userId,
                addressId: dto.addressId,
                orderStatus: ORDERSTATUS.PENDING,
                paymentMethod: dto.paymentMethod,
                paymentStatus: dto.paymentMethod === PAYMENTMETHOD.SEPAY
                    ? PAYMENTSTATUS.PENDING
                    : PAYMENTSTATUS.PENDING,
                subTotal: calculation.data.subtotal,
                deliveryFee: calculation.data.deliveryFee,
                discount: calculation.data.discount,
                finalTotal: calculation.data.finalTotal,
                notes: dto.notes || null,
                momoTransId: null,
                momoRequestId: null,
                paidAt: null,
                cancelledReason: null
            } as Order, { transaction });

            // ⭐ BƯỚC 5: COPY CART ITEMS → ORDER ITEMS
            const cartItems = await this.cartItemsModel.findAll({
                where: {
                    cartId,
                    id: dto.cartItemIds
                },
                include: [{
                    model: this.cartItemsIngredientModel,
                    as: 'cartItemIngredients'
                }],
                transaction
            });

            if (!cartItems || cartItems.length === 0) {
                throw new BadRequestException('No cart items found');
            }

            for (const cartItem of cartItems) {
                // Tạo OrderItem
                const orderItem = await this.orderItemsModel.create({
                    orderId: createdOrder.dataValues.id,
                    productId: cartItem.dataValues.productId,
                    productVariantId: cartItem.dataValues.productVariantId,
                    quantity: cartItem.dataValues.quantity
                } as OrderItems, { transaction });

                // ⭐ BƯỚC 6: COPY INGREDIENTS
                if (cartItem.dataValues.cartItemIngredients && cartItem.dataValues.cartItemIngredients.length > 0) {
                    for (const ingredient of cartItem.dataValues.cartItemIngredients) {
                        await this.orderItemIngredientModel.create({
                            orderItemId: orderItem.dataValues.id,
                            ingredientId: ingredient.dataValues.ingredientId,
                            quantity: ingredient.dataValues.quantity
                        } as OrderItemIngredient, { transaction })
                    }
                }
            }

            //⭐ Bước 7: Xóa item trong cartItem và cartItemIngredient
            await this.cartItemsIngredientModel.destroy({
                where: {
                    cartItemId: {
                        [Op.in]: dto.cartItemIds
                    }
                },
                transaction
            })

            const deletedCount = await this.cartItemsModel.destroy({
                where: {
                    id: {
                        [Op.in]: dto.cartItemIds,
                    },
                    cartId
                },
                transaction
            });

            this.logger.log(`✅ Deleted ${deletedCount} cart items`)


            // ⭐ BƯỚC 9: COMMIT TRANSACTION
            await transaction.commit();

            this.logger.log(`Order ${orderNumber} created successfully`);

        } catch (error) {
            if (transaction) await transaction.rollback();
            this.logger.error(`Checkout failed: ${error.message}`);
            throw error;
        }

        // ⭐ BƯỚC 9A : XỬ LÝ THANH TOÁN
        if (dto.paymentMethod === PAYMENTMETHOD.SEPAY) {
            this.logger.log(`order: ${createdOrder}`);
            return await this.processSepayPayment(createdOrder);
        } else {
            // Thanh toán khi nhận hàng
            return {
                success: true,
                message: 'Order created successfully',
                data: {
                    orderNumber: createdOrder.dataValues.orderNumber,
                    orderId: createdOrder.dataValues.id,
                    finalTotal: createdOrder.dataValues.finalTotal,
                    paymentMethod: PAYMENTMETHOD.CASH
                }
            };
        }
    }

    /**
     * ⭐ Xử lý thanh toán SePay
     */
    private async processSepayPayment(order: Order) {
        try {
            // ⭐ BƯỚC 9A: THÊM VÀO REDIS SORTED SET
            await this.redisService.addPendingOrder(order.dataValues.orderNumber);

            this.logger.log(`Added order ${order.dataValues.orderNumber} to Redis pending list`);

            // ⭐ BƯỚC 9B: TẠO QR CODE SEPAY
            const sepayPayment = await this.sepayService.createPayment({
                orderNumber: order.dataValues.orderNumber,
                amount: order.dataValues.finalTotal,
                orderInfo: `Thanh toán đơn hàng ${order.dataValues.orderNumber}`
            });

            this.logger.log(`Sepay QR created for order ${order.dataValues.orderNumber}`);

            // ⭐ BƯỚC 10: RETURN PAYMENT INFO
            return {
                success: true,
                message: 'Order created successfully. Please complete bank transfer.',
                data: {
                    orderNumber: order.dataValues.orderNumber,
                    orderId: order.dataValues.id,
                    finalTotal: order.dataValues.finalTotal,
                    paymentMethod: PAYMENTMETHOD.SEPAY,
                    paymentInfo: {
                        qrCode: sepayPayment.qrDataURL,
                        bankAccount: sepayPayment.bankAccount,
                        bankName: sepayPayment.bankName,
                        accountName: sepayPayment.accountName,
                        transferContent: sepayPayment.transferContent,
                        amount: sepayPayment.amount
                    }
                }
            };

        } catch (error) {
            this.logger.error(`Sepay payment failed for order ${order.dataValues.orderNumber}: ${error.message}`);

            // Rollback: Xóa order khỏi Redis
            await this.redisService.removePendingOrder(order.dataValues.orderNumber);

            throw new BadRequestException(`Payment initialization failed: ${error.message}`);
        }
    }
}
