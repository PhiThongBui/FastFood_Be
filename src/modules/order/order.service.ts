import { Address, Combo, ComboItem, Ingredient, Order, OrderItemComboOption, OrderItemComboOptionIngredient, OrderItemIngredient, OrderItems, Product, ProductVariant, User } from '@/models';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(OrderItems) private readonly orderItemsModel: typeof OrderItems,
        @InjectModel(OrderItemIngredient) private readonly orderItemsIngredientModel: typeof OrderItemIngredient,
        @InjectModel(OrderItemComboOption) private readonly orderItemComboOptionModel: typeof OrderItemComboOption,
        @InjectModel(OrderItemComboOptionIngredient) private readonly orderItemComboOptionIngredientModel: typeof OrderItemComboOptionIngredient,
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

        let count = 0;
        let orders: Order[] = [];

        try {
            const result = await this.orderModel.findAndCountAll({
                where: whereClause,
                include: this.buildMyOrdersInclude(true),
                distinct: true,
                subQuery: false,
                limit: limitPage,
                offset: offsetPage,
                order: [['createdAt', 'DESC']]
            });

            count = result.count;
            orders = result.rows;
        } catch (error: any) {
            if (!this.isMissingNormalizedSchemaError(error)) {
                throw error;
            }

            this.logger.warn('Normalized order schema is not fully available yet. Falling back to metadata-only order history query.');

            const legacyResult = await this.orderModel.findAndCountAll({
                where: whereClause,
                include: this.buildMyOrdersInclude(false),
                distinct: true,
                subQuery: false,
                limit: limitPage,
                offset: offsetPage,
                order: [['createdAt', 'DESC']]
            });

            count = legacyResult.count;
            orders = legacyResult.rows;
        }

        const items = orders.map((order) => {
            const plain = order.get({ plain: true }) as any;
            const mappedOrderItems = (plain.orderItems || []).map((item: any) => {
                const metadata = item.metadata || {};
                const singleMetadata = metadata.singleItemMetadata || {};
                const normalizedComboItems = this.buildNormalizedComboItems(item);
                const legacyComboItems = this.buildLegacyComboItems(metadata.items || []);
                const comboItemsSource = normalizedComboItems.length > 0
                    ? 'NORMALIZED_SNAPSHOT'
                    : legacyComboItems.length > 0
                        ? 'LEGACY_METADATA'
                        : 'NONE';
                const normalizedIngredients = this.buildNormalizedSingleIngredients(item);

                return {
                    id: item.id,
                    productId: item.productId,
                    productVariantId: item.productVariantId,
                    comboId: item.comboId,
                    quantity: item.quantity,
                    name: metadata.itemName || item.product?.name || item.combo?.name || 'San pham',
                    imageUrl: item.product?.imageUrl || item.combo?.imageUrl || null,
                    variantName: singleMetadata.variantName || this.buildVariantName(item.productVariant) || '',
                    originalPrice: this.resolveOrderItemOriginalPrice(item, metadata, normalizedComboItems),
                    finalPrice: this.resolveOrderItemFinalPrice(item, metadata, normalizedComboItems),
                    comboPricing: this.buildComboPricing(item, metadata, normalizedComboItems),
                    comboItemsSource,
                    comboItems: normalizedComboItems.length > 0 ? normalizedComboItems : legacyComboItems,
                    ingredients: normalizedIngredients.length > 0 ? normalizedIngredients : (singleMetadata.ingredients || []),
                    metadata
                };
            });
            const derivedSubTotal = mappedOrderItems.reduce(
                (total: number, item: any) => total + (Number(item.finalPrice || 0) * Math.max(Number(item.quantity || 1), 1)),
                0
            );
            const deliveryFee = Number(plain.deliveryFee || 0);
            const discount = Number(plain.discount || 0);
            const effectiveSubTotal = derivedSubTotal > 0 ? derivedSubTotal : Number(plain.subTotal || 0);

            return {
                id: plain.id,
                orderNumber: plain.orderNumber,
                orderStatus: plain.orderStatus,
                paymentMethod: plain.paymentMethod,
                paymentStatus: plain.paymentStatus,
                subTotal: effectiveSubTotal,
                deliveryFee,
                discount,
                finalTotal: effectiveSubTotal - discount + deliveryFee,
                notes: plain.notes,
                paidAt: plain.paidAt,
                createdAt: plain.createdAt,
                updatedAt: plain.updatedAt,
                address: plain.address,
                items: mappedOrderItems
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

    private buildMyOrdersInclude(includeNormalized: boolean) {
        const orderItemInclude: any[] = [
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
                attributes: ['id', 'name', 'imageUrl', 'price', 'discountPercentage']
            }
        ];

        if (includeNormalized) {
            orderItemInclude.push(
                {
                    model: OrderItemIngredient,
                    attributes: ['id', 'ingredientId', 'quantity', 'type', 'ingredientNameSnapshot', 'priceSnapshot']
                },
                {
                    model: OrderItemComboOption,
                    attributes: [
                        'id',
                        'comboItemId',
                        'slotIndex',
                        'selectedProductId',
                        'selectedProductVariantId',
                        'productNameSnapshot',
                        'variantNameSnapshot',
                        'unitPriceSnapshot',
                        'originalProductNameSnapshot',
                        'originalVariantNameSnapshot',
                        'selectedProductNameSnapshot',
                        'selectedVariantNameSnapshot',
                        'originalVariantModifiedPriceSnapshot',
                        'selectedVariantModifiedPriceSnapshot',
                        'variantSurchargeSnapshot',
                        'ingredientSurchargeSnapshot',
                        'surchargeSnapshot'
                    ],
                    include: [
                        {
                            model: ComboItem,
                            attributes: ['id', 'productId', 'productVariantId', 'quantity'],
                            include: [
                                {
                                    model: Product,
                                    attributes: ['id', 'name', 'imageUrl']
                                },
                                {
                                    model: ProductVariant,
                                    attributes: ['id', 'size', 'type', 'modifiedPrice']
                                }
                            ]
                        },
                        {
                            model: OrderItemComboOptionIngredient,
                            attributes: ['id', 'ingredientId', 'ingredientNameSnapshot', 'quantity', 'priceSnapshot', 'type']
                        }
                    ]
                }
            );
        }

        return [
            {
                model: Address,
                attributes: ['id', 'recipientName', 'recipientPhone', 'street', 'ward', 'district', 'city']
            },
            {
                model: OrderItems,
                attributes: ['id', 'productId', 'productVariantId', 'comboId', 'quantity', 'metadata'],
                include: orderItemInclude
            }
        ];
    }

    private isMissingNormalizedSchemaError(error: any) {
        const message = String(error?.message || error?.original?.message || '');
        const sql = String(error?.sql || '');
        const combined = `${message} ${sql}`;

        if (error?.name !== 'SequelizeDatabaseError') {
            return false;
        }

        return (
            combined.includes('ingredientNameSnapshot') ||
            combined.includes('priceSnapshot') ||
            combined.includes('originalProductNameSnapshot') ||
            combined.includes('variantSurchargeSnapshot') ||
            combined.includes('surchargeSnapshot') ||
            combined.includes('OrderItemComboOptions') ||
            combined.includes('OrderItemComboOptionIngredients')
        );
    }

    private buildVariantName(productVariant?: any) {
        if (!productVariant) return '';

        if (productVariant.size && productVariant.type) {
            return `${productVariant.size} - ${productVariant.type}`;
        }

        return '';
    }

    private buildNormalizedSingleIngredients(item: any) {
        const orderItemIngredients = item.orderItemIngredients || [];
        const orderItemQuantity = Math.max(Number(item.quantity || 1), 1);
        const hasSnapshots = orderItemIngredients.some((ingredient: any) =>
            ingredient.ingredientNameSnapshot !== null &&
            ingredient.ingredientNameSnapshot !== undefined
        );

        if (!hasSnapshots) return [];

        return orderItemIngredients.map((ingredient: any) => {
            const quantity = Number(ingredient.quantity || 0) / orderItemQuantity;
            const price = Number(ingredient.priceSnapshot || 0);

            return {
                name: ingredient.ingredientNameSnapshot || `Ingredient ${ingredient.ingredientId}`,
                quantity,
                price,
                totalPrice: ingredient.type === 'ADD' ? price * quantity : 0,
                type: ingredient.type || 'ADD'
            };
        });
    }

    private buildNormalizedComboItems(item: any) {
        const orderItemComboOptions = item.orderItemComboOptions || [];
        if (orderItemComboOptions.length === 0) return [];

        return orderItemComboOptions
            .slice()
            .sort((a: any, b: any) => {
                const slotDiff = Number(a.slotIndex || 0) - Number(b.slotIndex || 0);
                if (slotDiff !== 0) return slotDiff;
                return Number(a.id || 0) - Number(b.id || 0);
            })
            .map((option: any) => {
                const comboItem = option.comboItem || {};
                const defaultProduct = comboItem.product || {};
                const defaultVariant = comboItem.productVariant || {};

                const defaultProductId = comboItem.productId ? Number(comboItem.productId) : null;
                const defaultVariantId = comboItem.productVariantId ? Number(comboItem.productVariantId) : null;
                const defaultProductName = option.originalProductNameSnapshot || defaultProduct.name || option.productNameSnapshot || `Product ${option.selectedProductId}`;
                const defaultVariantName = option.originalVariantNameSnapshot || this.buildVariantName(defaultVariant);
                const defaultUnitPrice = Number(option.originalVariantModifiedPriceSnapshot ?? defaultVariant.modifiedPrice ?? 0);

                const selectedProductId = Number(option.selectedProductId || 0);
                const selectedVariantId = Number(option.selectedProductVariantId || 0);
                const selectedProductName = option.selectedProductNameSnapshot || option.productNameSnapshot || defaultProductName;
                const selectedVariantName = option.selectedVariantNameSnapshot || option.variantNameSnapshot || defaultVariantName;
                const selectedUnitPrice = Number(option.selectedVariantModifiedPriceSnapshot ?? option.unitPriceSnapshot ?? 0);

                const isReplacement =
                    (defaultProductId !== null && selectedProductId !== defaultProductId) ||
                    (defaultVariantId !== null && selectedVariantId !== defaultVariantId);

                const variantPriceDelta = option.variantSurchargeSnapshot !== null && option.variantSurchargeSnapshot !== undefined
                    ? Number(option.variantSurchargeSnapshot || 0)
                    : (isReplacement ? selectedUnitPrice - defaultUnitPrice : 0);

                const ingredients = (option.ingredients || []).map((ingredient: any) => {
                    const quantity = Number(ingredient.quantity || 1);
                    const unitPrice = Number(ingredient.priceSnapshot || 0);
                    const totalPrice = ingredient.type === 'ADD'
                        ? unitPrice * quantity
                        : 0;

                    return {
                        name: ingredient.ingredientNameSnapshot || `Ingredient ${ingredient.ingredientId}`,
                        quantity,
                        price: unitPrice,
                        totalPrice,
                        type: ingredient.type || 'ADD'
                    };
                });

                const calculatedIngredientPriceDelta = ingredients.reduce(
                    (total: number, ingredient: any) => total + Number(ingredient.totalPrice || 0),
                    0
                );
                const ingredientPriceDelta = option.ingredientSurchargeSnapshot !== null && option.ingredientSurchargeSnapshot !== undefined
                    ? Number(option.ingredientSurchargeSnapshot || 0)
                    : calculatedIngredientPriceDelta;
                const surcharge = option.surchargeSnapshot !== null && option.surchargeSnapshot !== undefined
                    ? Number(option.surchargeSnapshot || 0)
                    : variantPriceDelta + ingredientPriceDelta;

                return {
                    comboItemId: Number(option.comboItemId || 0),
                    slotIndex: Number(option.slotIndex || 0),
                    originalItem: {
                        productId: defaultProductId,
                        productName: defaultProductName,
                        variantId: defaultVariantId,
                        variantName: defaultVariantName,
                        unitPrice: defaultUnitPrice
                    },
                    changedItem: isReplacement ? {
                        productId: selectedProductId,
                        productName: selectedProductName,
                        variantId: selectedVariantId,
                        variantName: selectedVariantName,
                        unitPrice: selectedUnitPrice
                    } : null,
                    originalProductName: defaultProductName,
                    originalVariantName: defaultVariantName,
                    originalUnitPrice: defaultUnitPrice,
                    changedProductName: isReplacement ? selectedProductName : null,
                    changedVariantName: isReplacement ? selectedVariantName : null,
                    changedUnitPrice: isReplacement ? selectedUnitPrice : null,
                    variantPriceDelta,
                    variantSurcharge: variantPriceDelta,
                    isChanged: isReplacement,
                    surcharge,
                    quantity: 1,
                    ingredients,
                    ingredientPriceDelta
                };
            });
    }

    private buildLegacyComboItems(metadataItems: any[]) {
        if (!Array.isArray(metadataItems) || metadataItems.length === 0) return [];

        return metadataItems.map((metadataItem: any) => {
            const productName = metadataItem.productName || metadataItem.selectedProductName || metadataItem.changedProductName || 'San pham trong combo';
            const variantName = metadataItem.variantName || metadataItem.selectedVariantName || metadataItem.changedVariantName || '';

            return {
                ...metadataItem,
                productName,
                variantName,
                selectedProductName: productName,
                selectedVariantName: variantName,
                displayName: productName,
                displayVariantName: variantName,
                isLegacySelectionOnly: true,
                ingredients: Array.isArray(metadataItem.ingredients) ? metadataItem.ingredients : []
            };
        });
    }

    private buildComboPricing(item: any, metadata: any, normalizedComboItems: any[]) {
        if (!item?.comboId) {
            return null;
        }

        const snapshotPricing = metadata?.comboPricing;
        if (snapshotPricing) {
            const variantSurcharge = Number(snapshotPricing.variantSurcharge || 0);
            const ingredientSurcharge = Number(snapshotPricing.ingredientSurcharge || 0);
            const totalSurcharge = Number(snapshotPricing.totalSurcharge || variantSurcharge + ingredientSurcharge);
            const originalPrice = Number(
                snapshotPricing.originalPrice ||
                snapshotPricing.discountedBasePrice ||
                Math.max(Number(snapshotPricing.priceAfterChange || metadata?.finalPrice || 0) - totalSurcharge, 0)
            );
            const changedPrice = Number(snapshotPricing.changedPrice || snapshotPricing.priceAfterChange || originalPrice + totalSurcharge);

            return {
                originalPrice,
                changedPrice,
                totalSurcharge,
                variantSurcharge,
                ingredientSurcharge,
                basePrice: Number(snapshotPricing.basePrice || 0),
                discountedBasePrice: Number(snapshotPricing.discountedBasePrice || originalPrice),
                originalListPrice: Number(snapshotPricing.basePrice || metadata?.originalPrice || 0),
                discountPercentage: Number(snapshotPricing.discountPercentage || 0),
                savedAmount: Number(snapshotPricing.savedAmount || 0)
            };
        }

        const comboBasePrice = Number(item?.combo?.price || 0);
        const comboDiscountPercentage = Number(item?.combo?.discountPercentage || 0);
        const discountedComboBasePrice = Math.ceil(
            (comboBasePrice * (1 - (comboDiscountPercentage / 100))) / 1000
        ) * 1000;
        const fallbackFinalPrice = Number(metadata?.finalPrice || 0);
        const fallbackOriginalPrice = Number(metadata?.originalPrice || 0);

        if (normalizedComboItems.length === 0) {
            const legacyOriginalPrice = fallbackOriginalPrice || fallbackFinalPrice || discountedComboBasePrice;
            const legacyChangedPrice = fallbackFinalPrice || legacyOriginalPrice;

            return {
                originalPrice: legacyOriginalPrice,
                changedPrice: legacyChangedPrice,
                totalSurcharge: 0,
                variantSurcharge: 0,
                ingredientSurcharge: 0,
                basePrice: fallbackOriginalPrice || comboBasePrice,
                discountedBasePrice: legacyOriginalPrice,
                originalListPrice: fallbackOriginalPrice || comboBasePrice,
                discountPercentage: comboDiscountPercentage,
                savedAmount: 0
            };
        }

        const variantSurcharge = normalizedComboItems.reduce(
            (total: number, comboItem: any) => total + Number(comboItem.variantPriceDelta || 0),
            0
        );
        const ingredientSurcharge = normalizedComboItems.reduce(
            (total: number, comboItem: any) => total + Number(comboItem.ingredientPriceDelta || 0),
            0
        );
        const totalSurcharge = variantSurcharge + ingredientSurcharge;
        const comboOriginalPrice = discountedComboBasePrice || Math.max(fallbackFinalPrice - totalSurcharge, 0);
        const comboChangedPrice = comboOriginalPrice + totalSurcharge;

        return {
            originalPrice: Math.max(comboOriginalPrice, 0),
            changedPrice: Math.max(comboChangedPrice, 0),
            totalSurcharge,
            variantSurcharge,
            ingredientSurcharge,
            basePrice: comboBasePrice || fallbackOriginalPrice,
            discountedBasePrice: discountedComboBasePrice || comboOriginalPrice,
            originalListPrice: comboBasePrice || fallbackOriginalPrice,
            discountPercentage: comboDiscountPercentage,
            savedAmount: Math.max((comboBasePrice || 0) - (discountedComboBasePrice || 0), 0)
        };
    }

    private resolveOrderItemOriginalPrice(item: any, metadata: any, normalizedComboItems: any[]) {
        const comboPricing = this.buildComboPricing(item, metadata, normalizedComboItems);
        if (comboPricing) {
            return Number(comboPricing.originalPrice || 0);
        }

        return Number(metadata?.originalPrice || 0);
    }

    private resolveOrderItemFinalPrice(item: any, metadata: any, normalizedComboItems: any[]) {
        const comboPricing = this.buildComboPricing(item, metadata, normalizedComboItems);
        if (comboPricing) {
            return Number(comboPricing.changedPrice || 0);
        }

        return Number(metadata?.finalPrice || 0);
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
