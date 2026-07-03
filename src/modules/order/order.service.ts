import { Address, Combo, Ingredient, Order, OrderItemIngredient, OrderItems, Product, ProductVariant, User } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AddressService } from '../address/address.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Sequelize } from 'sequelize-typescript';
import { Helper } from '@/utils/helper';
import { ORDERSTATUS, PAYMENTSTATUS } from '@/models/order.model';
import { Op } from 'sequelize';

interface MyOrdersQuery {
    page?: string | number;
    limit?: string | number;
    search?: string;
    minPrice?: string | number;
    maxPrice?: string | number;
    orderStatus?: string;
    paymentStatus?: string;
}

@Injectable()
export class OrderService {
    constructor(
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(OrderItems) private readonly orderItemsModel: typeof OrderItems,
        @InjectModel(OrderItems) private readonly orderItemsIngredientModel: typeof OrderItemIngredient,
        @InjectModel(Address) private readonly addressModel: typeof Address,
        @InjectModel(ProductVariant) private readonly productVariantModel: typeof ProductVariant,
        @InjectModel(Product) private readonly productModel: typeof Product,
        @InjectModel(Ingredient) private readonly ingredientModel: typeof Ingredient,
        private readonly addressService: AddressService,
        private readonly sequelize: Sequelize
    ) { }

    async getMyOrders(userId: number, query: MyOrdersQuery = {}) {
        if (!userId) throw new BadRequestException('User id not found');

        const currentPage = Math.max(Number(query.page || 1), 1);
        const limitPage = Math.min(Math.max(Number(query.limit || 5), 1), 50);
        const offsetPage = (currentPage - 1) * limitPage;
        const search = query.search?.trim();
        const minPrice = Number(query.minPrice);
        const maxPrice = Number(query.maxPrice);
        const whereClause: any = { userId };

        if (query.orderStatus) {
            whereClause.orderStatus = query.orderStatus;
        }

        if (query.paymentStatus) {
            whereClause.paymentStatus = query.paymentStatus;
        }

        if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
            whereClause.finalTotal = {};
            if (!Number.isNaN(minPrice)) whereClause.finalTotal[Op.gte] = minPrice;
            if (!Number.isNaN(maxPrice)) whereClause.finalTotal[Op.lte] = maxPrice;
        }

        if (search) {
            whereClause[Op.or] = [
                { orderNumber: { [Op.iLike]: `%${search}%` } },
                { '$orderItems.product.name$': { [Op.iLike]: `%${search}%` } },
                { '$orderItems.combo.name$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: orders } = await this.orderModel.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Address,
                    attributes: ['id', 'recipientName', 'recipientPhone', 'street', 'ward', 'district', 'city']
                },
                {
                    model: OrderItems,
                    attributes: ['id', 'productId', 'productVariantId', 'comboId', 'quantity', 'metadata'],
                    include: [
                        {
                            model: Product,
                            attributes: ['id', 'name', 'imageUrl']
                        },
                        {
                            model: ProductVariant,
                            attributes: ['id', 'size', 'type', 'modifiedPrice']
                        },
                        {
                            model: Combo,
                            attributes: ['id', 'name', 'imageUrl']
                        }
                    ]
                }
            ],
            distinct: true,
            subQuery: false,
            limit: limitPage,
            offset: offsetPage,
            order: [['createdAt', 'DESC']]
        });

        const items = orders.map((order) => {
            const plain = order.get({ plain: true }) as any;

            return {
                id: plain.id,
                orderNumber: plain.orderNumber,
                orderStatus: plain.orderStatus,
                paymentMethod: plain.paymentMethod,
                paymentStatus: plain.paymentStatus,
                subTotal: plain.subTotal,
                deliveryFee: plain.deliveryFee,
                discount: plain.discount,
                finalTotal: plain.finalTotal,
                notes: plain.notes,
                paidAt: plain.paidAt,
                createdAt: plain.createdAt,
                updatedAt: plain.updatedAt,
                address: plain.address,
                items: (plain.orderItems || []).map((item: any) => {
                    const metadata = item.metadata || {};
                    const singleMetadata = metadata.singleItemMetadata || {};

                    return {
                        id: item.id,
                        productId: item.productId,
                        productVariantId: item.productVariantId,
                        comboId: item.comboId,
                        quantity: item.quantity,
                        name: metadata.itemName || item.product?.name || item.combo?.name || 'Sáº£n pháº©m',
                        imageUrl: item.product?.imageUrl || item.combo?.imageUrl || null,
                        variantName: singleMetadata.variantName || '',
                        originalPrice: Number(metadata.originalPrice || 0),
                        finalPrice: Number(metadata.finalPrice || 0),
                        comboItems: metadata.items || [],
                        ingredients: singleMetadata.ingredients || [],
                        metadata
                    };
                })
            };
        });

        return {
            items,
            pagination: {
                page: currentPage,
                limit: limitPage,
                totalItems: count,
                totalPages: Math.ceil(count / limitPage)
            }
        };
    }

    async createOrder(orderData: CreateOrderDto): Promise<Order> {

        const transaction = await this.sequelize.transaction()

        try {
            const address = await this.addressModel.findByPk(orderData.addressId, { transaction });
            if (!address) {
                throw new BadRequestException('Address not found');
            }
            if (address.userId !== orderData.userId) {
                throw new BadRequestException('This address does not belong to this user');
            }

            const distanceResult = await this.addressService.caculateDistance(address.latitude, address.longitude);

            if (!Helper.validateDeliveryDistance(distanceResult.distance)) {
                throw new BadRequestException(Helper.buildDeliveryRangeError(distanceResult.distance));
            }

            const deliveryFee = Helper.caculateDeliveryFee(distanceResult.distance);

            const subTotal = await this.caculateSubtotal(orderData.orderItems, transaction);
            const discount = orderData.discount ? orderData.discount : 0;

            const finalTotal = subTotal - discount + deliveryFee;

            const orderNumber = await Helper.generateOrderNumber();

            const newOrder = await this.orderModel.create({
                orderNumber,
                userId: orderData.userId,
                addressId: orderData.addressId,
                orderStatus: ORDERSTATUS.PENDING,
                paymentMethod: orderData.paymentMethod,
                paymentStatus: PAYMENTSTATUS.PENDING,
                subTotal,
                deliveryFee,
                discount,
                finalTotal,
                notes: orderData.note || null
            } as Order, { transaction });

            await this.createOrderItems(newOrder.id, orderData.orderItems, transaction);

            await transaction.commit();

            return await this.orderModel.findByPk(newOrder.id, {
                include: [
                    {
                        model: Address,
                        attributes: ['address', 'latitude', 'longitude']
                    },
                    {
                        model: User,
                        attributes: ['firstName', 'lastName']
                    },
                    {
                        model: OrderItems,
                        include: [
                            {
                                model: Product,
                                attributes: ['name', 'basePrice', 'imageUrl']
                            },
                            {
                                model: ProductVariant,
                                attributes: ['name', 'size', 'type', 'modifiedPrice']
                            },
                            {
                                model: OrderItemIngredient,
                                include: [
                                    {
                                        model: Ingredient,
                                        attributes: ['name', 'price']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }) as Order;



        } catch (error: any) {
            console.log(error.message);
            await transaction.rollback();
            throw error
        }
    }

    async caculateSubtotal(orderItems: CreateOrderDto['orderItems'], transaction: any): Promise<number> {
        let subToal = 0

        for (const item of orderItems) {
            let productPrice = 0
            const product = await this.productModel.findByPk(item.productId, { transaction });
            if (item.productVariantId) {
                const productVariant = await this.productVariantModel.findByPk(item.productVariantId, { transaction });

                if (product && product.dataValues && productVariant && productVariant.dataValues) {
                    productPrice = product?.dataValues?.basePrice + productVariant?.dataValues?.modifiedPrice
                }
            } else {
                if (product && product.dataValues) {
                    productPrice = product?.dataValues?.basePrice
                }
            }
            let ingredientPrice = 0
            if (item.ingredients) {
                for (const ingredients of item.ingredients) {
                    const ingredient = await this.ingredientModel.findByPk(ingredients.ingredientId, { transaction });

                    if (ingredient && ingredient.dataValues) {
                        ingredientPrice += (ingredient?.dataValues?.price || 0) * ingredients.quantity
                    }
                }
            }

            subToal += (productPrice + ingredientPrice) * item.quantity
        }

        return subToal
    }

    async createOrderItems(orderId: number, orderItem: CreateOrderDto['orderItems'], transaction: any): Promise<void> {
        for (const item of orderItem) {
            const newOrderItem = await this.orderItemsModel.create({
                orderId,
                productId: item.productId,
                productVariantId: item.productVariantId,
                quantity: item.quantity
            } as OrderItems, { transaction });

            if (item.ingredients) {
                for (const ingredients of item.ingredients) {
                    await this.orderItemsIngredientModel.create({
                        orderItemId: newOrderItem.id,
                        ingredientId: ingredients.ingredientId,
                        quantity: ingredients.quantity
                    } as OrderItemIngredient, { transaction });
                }
            }
        }
    }
}



