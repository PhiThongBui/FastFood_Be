import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import {
    CartItemComboOption,
    CartItemComboOptionIngredient,
    CartItems,
    CartItemsIngredient,
    Ingredient,
    OrderItemComboOption,
    OrderItemComboOptionIngredient,
    OrderItemIngredient,
    OrderItems,
} from '@/models';
import { CartPreviewItem } from '../cart-preview/types/cart-prev.type';

@Injectable()
export class OrderItemSnapshotService {
    constructor(
        @InjectModel(OrderItems) private readonly orderItemsModel: typeof OrderItems,
        @InjectModel(OrderItemComboOption) private readonly orderItemComboOptionModel: typeof OrderItemComboOption,
        @InjectModel(OrderItemComboOptionIngredient) private readonly orderItemComboOptionIngredientModel: typeof OrderItemComboOptionIngredient,
        @InjectModel(OrderItemIngredient) private readonly orderItemIngredientModel: typeof OrderItemIngredient,
        @InjectModel(CartItems) private readonly cartItemsModel: typeof CartItems,
        @InjectModel(CartItemsIngredient) private readonly cartItemsIngredientModel: typeof CartItemsIngredient,
        @InjectModel(CartItemComboOption) private readonly cartItemComboOptionModel: typeof CartItemComboOption,
        @InjectModel(CartItemComboOptionIngredient) private readonly cartItemComboOptionIngredientModel: typeof CartItemComboOptionIngredient,
        @InjectModel(Ingredient) private readonly ingredientModel: typeof Ingredient,
    ) {}

    async createOrderItemsFromCartItems(
        orderId: number,
        cartItems: CartItems[],
        previewItemMap: Map<number, CartPreviewItem>,
        transaction: Transaction,
        kitchenTicketId?: number | null,
    ) {
        const cartItemIds = cartItems.map((item) => Number(item.dataValues.id));
        const cartItemIngredients = await this.cartItemsIngredientModel.findAll({
            where: {
                cartItemId: {
                    [Op.in]: cartItemIds,
                },
            },
            include: [
                {
                    model: this.ingredientModel,
                    attributes: ['id', 'name', 'price'],
                },
            ],
            transaction,
        });
        const ingredientMap = new Map<number, CartItemsIngredient[]>();

        cartItemIngredients.forEach((ingredient) => {
            const cartItemId = Number(ingredient.dataValues.cartItemId);
            const ingredients = ingredientMap.get(cartItemId) || [];
            ingredients.push(ingredient);
            ingredientMap.set(cartItemId, ingredients);
        });

        const createdItems: OrderItems[] = [];

        for (const cartItem of cartItems) {
            const previewItem = previewItemMap.get(Number(cartItem.dataValues.id));
            if (!previewItem) {
                throw new BadRequestException(`Cart item ${cartItem.dataValues.id} is not available for checkout`);
            }

            const orderItem = await this.orderItemsModel.create({
                orderId,
                productId: cartItem.dataValues.productId,
                productVariantId: cartItem.dataValues.productVariantId,
                comboId: cartItem.dataValues.comboId,
                kitchenTicketId: kitchenTicketId || null,
                quantity: cartItem.dataValues.quantity,
                metadata: this.buildOrderItemMetadata(previewItem),
            } as OrderItems, { transaction });

            const ingredients = ingredientMap.get(Number(cartItem.dataValues.id)) || [];
            await this.persistOrderItemRelations(orderItem, previewItem, ingredients, transaction);
            createdItems.push(orderItem);
        }

        return createdItems;
    }

    async clearCartItems(cartId: number, cartItemIds: number[], transaction: Transaction) {
        const comboOptions = await this.cartItemComboOptionModel.findAll({
            where: {
                cartItemId: {
                    [Op.in]: cartItemIds,
                },
            },
            attributes: ['id'],
            transaction,
        });
        const comboOptionIds = comboOptions.map((option) => Number(option.id));

        if (comboOptionIds.length > 0) {
            await this.cartItemComboOptionIngredientModel.destroy({
                where: {
                    cartItemComboOptionId: {
                        [Op.in]: comboOptionIds,
                    },
                },
                transaction,
            });
            await this.cartItemComboOptionModel.destroy({
                where: {
                    id: {
                        [Op.in]: comboOptionIds,
                    },
                },
                transaction,
            });
        }

        await this.cartItemsIngredientModel.destroy({
            where: {
                cartItemId: {
                    [Op.in]: cartItemIds,
                },
            },
            transaction,
        });

        return this.cartItemsModel.destroy({
            where: {
                id: {
                    [Op.in]: cartItemIds,
                },
                cartId,
            },
            transaction,
        });
    }

    private buildOrderItemMetadata(previewItem: CartPreviewItem) {
        const originalPrice = Number(previewItem.details?.originalPrice || previewItem.unitPrice || 0);
        const finalPrice = Number(previewItem.unitPrice || 0);

        if (previewItem.type === 'COMBO') {
            const comboPricing = {
                basePrice: Number(previewItem.details?.basePrice || 0),
                discountedBasePrice: Number(previewItem.details?.discountedBasePrice || 0),
                originalPrice: Number(previewItem.details?.discountedBasePrice || finalPrice),
                changedPrice: Number(previewItem.details?.priceAfterChange || finalPrice),
                discountPercentage: Number(previewItem.details?.discountPercentage || 0),
                savedAmount: Number(previewItem.details?.savedAmount || 0),
                variantSurcharge: Number(previewItem.details?.variantSurcharge || 0),
                ingredientSurcharge: Number(previewItem.details?.ingredientSurcharge || 0),
                totalSurcharge: Number(previewItem.details?.totalSurcharge || 0),
                priceAfterChange: Number(previewItem.details?.priceAfterChange || finalPrice),
            };

            return {
                itemName: previewItem.name,
                originalPrice,
                finalPrice,
                totalPrice: Number(previewItem.totalPrice || finalPrice * previewItem.quantity),
                comboPricing,
                items: (previewItem.rawData?.comboOptions || []).map((option: any) => ({
                    comboItemId: Number(option.comboItemId || 0),
                    slotIndex: Number(option.slotIndex || 0),
                    productId: Number(option.productId),
                    productName: option.product?.name || '',
                    variantId: Number(option.productVariantId),
                    variantName: option.variant
                        ? `${option.variant.size} - ${option.variant.type}`
                        : '',
                    originalProductName: option.originalProductName || '',
                    originalVariantName: option.originalVariantName || '',
                    changedProductName: Number(option.productId) !== Number(option.originalProductId) || Number(option.productVariantId) !== Number(option.originalProductVariantId)
                        ? (option.selectedProductName || option.product?.name || '')
                        : null,
                    changedVariantName: Number(option.productId) !== Number(option.originalProductId) || Number(option.productVariantId) !== Number(option.originalProductVariantId)
                        ? (option.selectedVariantName || (option.variant ? `${option.variant.size} - ${option.variant.type}` : ''))
                        : null,
                    unitPrice: Number(option.selectedVariantModifiedPrice ?? option.variant?.modifiedPrice ?? 0),
                    originalVariantModifiedPrice: Number(option.originalVariantModifiedPrice || 0),
                    selectedVariantModifiedPrice: Number(option.selectedVariantModifiedPrice ?? option.variant?.modifiedPrice ?? 0),
                    variantSurcharge: Number(option.variantSurcharge || 0),
                    ingredientSurcharge: Number(option.ingredientSurcharge || 0),
                    surcharge: Number(option.surcharge || 0),
                    ingredients: (option.ingredients || []).map((ingredient: any) => ({
                        name: ingredient.name || `Ingredient ${ingredient.ingredientId}`,
                        quantity: Number(ingredient.quantity || 1),
                        price: Number(ingredient.price || 0),
                        totalPrice: ingredient.type === 'ADD'
                            ? Number(ingredient.price || 0) * Number(ingredient.quantity || 1)
                            : 0,
                        type: ingredient.type,
                    })),
                })),
            };
        }

        return {
            itemName: previewItem.name,
            originalPrice,
            finalPrice,
            singleItemMetadata: {
                variantName: previewItem.details?.variantName || '',
                ingredients: (previewItem.details?.ingredients || []).map((ingredient: any) => ({
                    name: ingredient.name || 'Ingredient',
                    quantity: Number(ingredient.quantity || 1),
                    price: Number(ingredient.price || 0),
                    type: ingredient.type || 'ADD',
                })),
            },
        };
    }

    private async persistOrderItemRelations(
        orderItem: OrderItems,
        previewItem: CartPreviewItem,
        cartIngredients: CartItemsIngredient[],
        transaction: Transaction,
    ) {
        const orderItemId = Number(orderItem.dataValues.id);

        if (previewItem.type === 'COMBO') {
            const comboOptions = previewItem.rawData?.comboOptions || [];

            for (const option of comboOptions as any[]) {
                if (!option.comboItemId) {
                    throw new BadRequestException(`Combo option for order item ${orderItemId} is missing comboItemId`);
                }

                const orderItemComboOption = await this.orderItemComboOptionModel.create({
                    orderItemId,
                    comboItemId: Number(option.comboItemId),
                    slotIndex: Number(option.slotIndex || 0),
                    selectedProductId: Number(option.productId),
                    selectedProductVariantId: Number(option.productVariantId),
                    productNameSnapshot: option.product?.name || `Product ${option.productId}`,
                    variantNameSnapshot: option.variant
                        ? `${option.variant.size} - ${option.variant.type}`
                        : '',
                    unitPriceSnapshot: Number(option.selectedVariantModifiedPrice ?? option.variant?.modifiedPrice ?? 0),
                    originalProductNameSnapshot: option.originalProductName || null,
                    originalVariantNameSnapshot: option.originalVariantName || null,
                    selectedProductNameSnapshot: option.selectedProductName || option.product?.name || null,
                    selectedVariantNameSnapshot: option.selectedVariantName || (option.variant ? `${option.variant.size} - ${option.variant.type}` : null),
                    originalVariantModifiedPriceSnapshot: Number(option.originalVariantModifiedPrice || 0),
                    selectedVariantModifiedPriceSnapshot: Number(option.selectedVariantModifiedPrice ?? option.variant?.modifiedPrice ?? 0),
                    variantSurchargeSnapshot: Number(option.variantSurcharge || 0),
                    ingredientSurchargeSnapshot: Number(option.ingredientSurcharge || 0),
                    surchargeSnapshot: Number(option.surcharge || 0),
                } as OrderItemComboOption, { transaction });

                for (const ingredient of option.ingredients || []) {
                    await this.orderItemComboOptionIngredientModel.create({
                        orderItemComboOptionId: Number(orderItemComboOption.dataValues.id),
                        ingredientId: Number(ingredient.ingredientId),
                        ingredientNameSnapshot: ingredient.name || `Ingredient ${ingredient.ingredientId}`,
                        quantity: Number(ingredient.quantity || 1),
                        priceSnapshot: Number(ingredient.price || 0),
                        type: ingredient.type || 'ADD',
                    } as OrderItemComboOptionIngredient, { transaction });
                }
            }

            return;
        }

        for (const ingredient of cartIngredients) {
            const ingredientSnapshot = ingredient.dataValues.ingredient?.dataValues || ingredient.dataValues.ingredient;

            await this.orderItemIngredientModel.create({
                orderItemId,
                ingredientId: ingredient.dataValues.ingredientId,
                quantity: ingredient.dataValues.quantity,
                type: ingredient.dataValues.type,
                ingredientNameSnapshot: ingredientSnapshot?.name || null,
                priceSnapshot: ingredient.dataValues.type === 'REMOVE'
                    ? 0
                    : Number(ingredientSnapshot?.price || 0),
            } as OrderItemIngredient, { transaction });
        }
    }
}
