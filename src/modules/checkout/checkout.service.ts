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
    CartItemComboOption,
    CartItemComboOptionIngredient,
    Address,
} from '@/models';
import { ORDERSTATUS, PAYMENTMETHOD, PAYMENTSTATUS } from '@/models/order.model';
import { CartPreviewService } from '../cart-preview/cart-preview.service';
import { RedisService } from '../redis/redis.service';
import { CheckoutConfirmDto } from './dto/checkout-confirm.dto';
import { SepayService } from '../sepay/sepay.service';
import { Op } from 'sequelize';
import { CouponService } from '../coupon/coupon.service';
import { CartPreviewItem } from '../cart-preview/types/cart-prev.type';

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
        @InjectModel(CartItemComboOption) private cartItemComboOptionModel: typeof CartItemComboOption,
        @InjectModel(CartItemComboOptionIngredient) private cartItemComboOptionIngredientModel: typeof CartItemComboOptionIngredient,
        @InjectModel(Address) private addressModel: typeof Address,
        private readonly cartPreviewService: CartPreviewService,
        private readonly couponService: CouponService,
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
            this.logger.log(`Starting checkout for user ${userId}, cart ${cartId}`);
            const cartItemIds = Array.from(new Set((dto.cartItemIds || []).map(id => Number(id)).filter(id => id > 0)));

            if (!userId) {
                throw new BadRequestException('User id not found');
            }

            if (!cartId) {
                throw new BadRequestException('Cart not found');
            }

            if (cartItemIds.length === 0) {
                throw new BadRequestException('Cart item ids are required');
            }

            // â­ BÆ¯á»šC 2: LOCK CART (FOR UPDATE)
            const cart = await this.cartsModel.findOne({
                where: { id: cartId, userId },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!cart) {
                throw new BadRequestException('Cart not found or already checked out');
            }

            const addressId = await this.resolveCheckoutAddressId(userId, dto, transaction);

            // â­ BÆ¯á»šC 3: RE-CALCULATE TOTALS
            const calculation = await this.cartPreviewService.checkoutCaculate(
                userId,
                cartId,
                {
                    cartItemIds,
                    addressId,
                    temporaryAddress: dto.temporaryAddress as any,
                    couponCode: dto.couponCode
                },
            );

            if (!calculation || !calculation.data) {
                throw new BadRequestException('Failed to calculate order totals');
            }

            if (!calculation.data.items || calculation.data.items.length === 0) {
                throw new BadRequestException('No valid cart items found for checkout');
            }

            const previewItemMap = new Map<number, CartPreviewItem>(
                calculation.data.items.map(item => [Number(item.cartItemId), item])
            );

            // â­ BÆ¯á»šC 4: CREATE ORDER
            const orderNumber = `ORD${Date.now()}`;

            this.logger.log(`Creating order: ${orderNumber}`);

            createdOrder = await this.orderModel.create({
                orderNumber,
                userId,
                addressId,
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

            // â­ BÆ¯á»šC 5: COPY CART ITEMS â†’ ORDER ITEMS
            const cartItems = await this.cartItemsModel.findAll({
                where: {
                    cartId,
                    id: { [Op.in]: cartItemIds }
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!cartItems || cartItems.length !== cartItemIds.length) {
                throw new BadRequestException('No cart items found');
            }

            const cartItemIngredients = await this.cartItemsIngredientModel.findAll({
                where: {
                    cartItemId: {
                        [Op.in]: cartItemIds
                    }
                },
                transaction
            });
            const ingredientMap = new Map<number, CartItemsIngredient[]>();
            cartItemIngredients.forEach(ingredient => {
                const cartItemId = Number(ingredient.dataValues.cartItemId);
                const ingredients = ingredientMap.get(cartItemId) || [];
                ingredients.push(ingredient);
                ingredientMap.set(cartItemId, ingredients);
            });

            for (const cartItem of cartItems) {
                const previewItem = previewItemMap.get(Number(cartItem.dataValues.id));
                if (!previewItem) {
                    throw new BadRequestException(`Cart item ${cartItem.dataValues.id} is not available for checkout`);
                }

                const orderItem = await this.orderItemsModel.create({
                    orderId: createdOrder.dataValues.id,
                    productId: cartItem.dataValues.productId,
                    productVariantId: cartItem.dataValues.productVariantId,
                    comboId: cartItem.dataValues.comboId,
                    quantity: cartItem.dataValues.quantity,
                    metadata: this.buildOrderItemMetadata(previewItem)
                } as OrderItems, { transaction });

                // â­ BÆ¯á»šC 6: COPY INGREDIENTS
                const ingredients = ingredientMap.get(Number(cartItem.dataValues.id)) || [];
                if (ingredients.length > 0) {
                    for (const ingredient of ingredients) {
                        await this.orderItemIngredientModel.create({
                            orderItemId: orderItem.dataValues.id,
                            ingredientId: ingredient.dataValues.ingredientId,
                            quantity: ingredient.dataValues.quantity,
                            type: ingredient.dataValues.type
                        } as OrderItemIngredient, { transaction })
                    }
                }
            }

            if (dto.couponCode) {
                await this.couponService.markCouponUsed(userId, dto.couponCode, transaction);
            }

            const comboOptions = await this.cartItemComboOptionModel.findAll({
                where: {
                    cartItemId: {
                        [Op.in]: cartItemIds
                    }
                },
                attributes: ['id'],
                transaction
            });
            const comboOptionIds = comboOptions.map(option => Number(option.id));

            if (comboOptionIds.length > 0) {
                await this.cartItemComboOptionIngredientModel.destroy({
                    where: {
                        cartItemComboOptionId: {
                            [Op.in]: comboOptionIds
                        }
                    },
                    transaction
                });
                await this.cartItemComboOptionModel.destroy({
                    where: {
                        id: {
                            [Op.in]: comboOptionIds
                        }
                    },
                    transaction
                });
            }

            //â­ BÆ°á»›c 7: XÃ³a item trong cartItem vÃ  cartItemIngredient
            await this.cartItemsIngredientModel.destroy({
                where: {
                    cartItemId: {
                        [Op.in]: cartItemIds
                    }
                },
                transaction
            })

            const deletedCount = await this.cartItemsModel.destroy({
                where: {
                    id: {
                        [Op.in]: cartItemIds,
                    },
                    cartId
                },
                transaction
            });

            this.logger.log(`âœ… Deleted ${deletedCount} cart items`)


            // â­ BÆ¯á»šC 9: COMMIT TRANSACTION
            await transaction.commit();

            this.logger.log(`Order ${orderNumber} created successfully`);

        } catch (error: any) {
            if (transaction) await transaction.rollback();
            this.logger.error(`Checkout failed: ${error.message}`);
            throw error;
        }

        // â­ BÆ¯á»šC 9A : Xá»¬ LÃ THANH TOÃN
        if (dto.paymentMethod === PAYMENTMETHOD.SEPAY) {
            this.logger.log(`order: ${createdOrder}`);
            return await this.processSepayPayment(createdOrder);
        } else {
            // Thanh toÃ¡n khi nháº­n hÃ ng
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

    private async resolveCheckoutAddressId(
        userId: number,
        dto: CheckoutConfirmDto,
        transaction: Transaction
    ): Promise<number> {
        if (!dto.addressId && !dto.temporaryAddress) {
            throw new BadRequestException('Either addressId or temporaryAddress must be provided.');
        }

        if (dto.addressId && dto.temporaryAddress) {
            throw new BadRequestException('Cannot use both addressId and temporaryAddress at the same time.');
        }

        if (dto.addressId) {
            const address = await this.addressModel.findByPk(dto.addressId, { transaction });
            if (!address) {
                throw new BadRequestException('No valid address found for checkout.');
            }
            if (Number(address.dataValues.userId) !== Number(userId)) {
                throw new BadRequestException('This address does not belong to this user');
            }

            return Number(address.dataValues.id);
        }

        const temporaryAddress = dto.temporaryAddress!;
        const address = await this.addressModel.create({
            userId,
            sessionId: null,
            recipientName: temporaryAddress.recipientName || 'Khach hang',
            recipientPhone: temporaryAddress.recipientPhone || '',
            city: temporaryAddress.city,
            district: temporaryAddress.district,
            latitude: temporaryAddress.latitude,
            longitude: temporaryAddress.longitude,
            isDefault: false
        } as Address, { transaction });

        return Number(address.dataValues.id);
    }

    private buildOrderItemMetadata(previewItem: CartPreviewItem) {
        const originalPrice = Number(previewItem.details?.originalPrice || previewItem.unitPrice || 0);
        const finalPrice = Number(previewItem.unitPrice || 0);

        if (previewItem.type === 'COMBO') {
            return {
                itemName: previewItem.name,
                originalPrice,
                finalPrice,
                items: (previewItem.rawData?.comboOptions || []).map(option => ({
                    productId: Number(option.productId),
                    productName: option.product?.name || '',
                    variantId: Number(option.productVariantId),
                    variantName: option.variant
                        ? `${option.variant.size} - ${option.variant.type}`
                        : '',
                    unitPrice: Number(option.variant?.modifiedPrice || 0),
                    ingredients: (option.ingredients || []).map(ingredient => ({
                        name: ingredient.name || `Ingredient ${ingredient.ingredientId}`,
                        quantity: Number(ingredient.quantity || 1),
                        price: Number(ingredient.price || 0),
                        type: ingredient.type
                    }))
                }))
            };
        }

        return {
            itemName: previewItem.name,
            originalPrice,
            finalPrice,
            singleItemMetadata: {
                variantName: previewItem.details?.variantName || '',
                ingredients: (previewItem.details?.ingredients || []).map(ingredient => ({
                    name: ingredient.name || `Ingredient`,
                    quantity: Number(ingredient.quantity || 1),
                    price: Number(ingredient.price || 0),
                    type: ingredient.type || 'ADD'
                }))
            }
        };
    }

    /**
     * â­ Xá»­ lÃ½ thanh toÃ¡n SePay
     */
    private async processSepayPayment(order: Order) {
        try {
            // â­ BÆ¯á»šC 9A: THÃŠM VÃ€O REDIS SORTED SET
            await this.redisService.addPendingOrder(order.dataValues.orderNumber);

            this.logger.log(`Added order ${order.dataValues.orderNumber} to Redis pending list`);

            // â­ BÆ¯á»šC 9B: Táº O QR CODE SEPAY
            const sepayPayment = await this.sepayService.createPayment({
                orderNumber: order.dataValues.orderNumber,
                amount: order.dataValues.finalTotal,
                orderInfo: `Thanh toÃ¡n Ä‘Æ¡n hÃ ng ${order.dataValues.orderNumber}`
            });

            this.logger.log(`Sepay QR created for order ${order.dataValues.orderNumber}`);

            // â­ BÆ¯á»šC 10: RETURN PAYMENT INFO
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

        } catch (error: any) {
            this.logger.error(`Sepay payment failed for order ${order.dataValues.orderNumber}: ${error.message}`);

            // Rollback: XÃ³a order khá»i Redis
            await this.redisService.removePendingOrder(order.dataValues.orderNumber);

            throw new BadRequestException(`Payment initialization failed: ${error.message}`);
        }
    }
}
