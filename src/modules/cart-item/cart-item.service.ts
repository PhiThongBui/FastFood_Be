import { actionUpdateCartItem } from './types/cartItem.type';
import { log } from 'node:console';
import { CartItemComboOption, CartItemComboOptionIngredient, CartItems, CartItemsIngredient, Carts, Combo, ComboItem, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ComboOptionDto, CreateCartItemDto } from './dto/cart-item.dto';
import { ProductService } from '../product/product.service';
import { ProductVariantService } from '../product-variant/product-variant.service';
import { CartService } from '../cart/cart.service';
import { CartItemIngredientService } from '../cart-item-ingredient/cart-item-ingredient.service';
import * as _ from 'lodash';
import { Helper } from '@/utils/helper';
import { UPDATE_CART_ITEM_TYPE, UpdateCartItemDto } from './dto/update-cart-item.dto.ts';
import { CartPreviewService } from '../cart-preview/cart-preview.service';
interface AddToCartParams extends CreateCartItemDto {
    userId?: number;
    sessionId?: string;
}

type NormalizedComboCartOption = {
    comboItemId: number;
    slotIndex: number;
    productId: number;
    productVariantId: number;
    ingredients: {
        ingredientId: number;
        quantity: number;
        type: 'ADD' | 'REMOVE';
    }[];
};

type NormalizedIngredientOption = {
    ingredientId: number;
    quantity: number;
    type: 'ADD' | 'REMOVE';
};

type ComboSlot = {
    comboItemId: number;
    slotIndex: number;
    productId: number;
    productVariantId: number;
};

@Injectable()
export class CartItemService {
    constructor(
        @InjectModel(Carts) private readonly modelCarts: typeof Carts,
        @InjectModel(CartItems) private readonly modelCartItems: typeof CartItems,
        @InjectModel(CartItemsIngredient) private readonly modelCartItemIngredient: typeof CartItemsIngredient,
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(Ingredient) private readonly modelIngredient: typeof Ingredient,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
        @InjectModel(Combo) private readonly modelCombo: typeof Combo,
        @InjectModel(ComboItem) private readonly modelComboItem: typeof ComboItem,
        @InjectModel(CartItemComboOption) private readonly modelCartItemComboOption: typeof CartItemComboOption,
        @InjectModel(CartItemComboOptionIngredient) private readonly modelCartItemComboOptionIngredient: typeof CartItemComboOptionIngredient,
        private readonly productService: ProductService,
        private readonly cartItemIngredientSerivce: CartItemIngredientService,
        private readonly productVariantService: ProductVariantService,
        private readonly cartService: CartService,
        private readonly cartPreviewService: CartPreviewService,

        private readonly sequelize: Sequelize
    ) { }

    async addToCart(dataAdd: AddToCartParams) {
        const {
            productId,
            productVariantId,
            quantity,
            userId,
            sessionId,
            singleProductOptions,
            comboId,
            comboOptions
        } = dataAdd;

        const transaction = await this.sequelize.transaction();

        try {
            if (quantity <= 0) {
                throw new BadGatewayException('Sá»‘ lÆ°á»£ng pháº£i lá»›n hÆ¡n 0!!!');
            }

            const isCombo = !!comboId;

            let finalComboOptions: NormalizedComboCartOption[] = [];
            let finalSingleProductOptions: NormalizedIngredientOption[] = [];

            // ==========================================
            // 1. VALIDATION & PREPARATION
            // ==========================================
            if (isCombo) {
                if (!comboId) throw new BadGatewayException('Thiáº¿u thÃ´ng tin Combo ID!');

                const existedCombo = await this.modelCombo.findByPk(comboId, { transaction });
                if (!existedCombo) throw new BadGatewayException('Combo khÃ´ng tá»“n táº¡i!');

                if (comboOptions && comboOptions.length > 0) {
                    finalComboOptions = await this.normalizeComboOptionsForCart(comboId, comboOptions, transaction);
                }
            }
            else {
                if (!productId || !productVariantId) {
                    throw new BadGatewayException('Thiáº¿u thÃ´ng tin sáº£n pháº©m!');
                }
                const existedProduct = await this.modelProduct.findByPk(productId, { transaction });
                if (existedProduct?.isActive === false) throw new BadGatewayException('Sáº£n pháº©m Ä‘Ã£ ngÆ°ng kinh doanh!');
                if (!existedProduct) throw new BadGatewayException('Sáº£n pháº©m khÃ´ng tá»“n táº¡i!');

                const existedProductVariant = await this.modelProductVariant.findByPk(productVariantId, { transaction });
                if (existedProductVariant?.isActive === false) throw new BadGatewayException('Biáº¿n thá»ƒ Ä‘Ã£ ngÆ°ng kinh doanh!');
                if (existedProductVariant && Number(existedProductVariant.productId) !== Number(productId)) {
                    throw new BadRequestException(
                        `Biáº¿n thá»ƒ ${productVariantId} khÃ´ng thuá»™c sáº£n pháº©m ${productId}! (DB: ${existedProductVariant.productId})`
                    );
                }
                if (!existedProductVariant) throw new BadGatewayException('Biáº¿n thá»ƒ khÃ´ng tá»“n táº¡i!');

                finalSingleProductOptions = await this.normalizeSingleProductOptionsForCart(
                    productId,
                    singleProductOptions || [],
                    transaction
                );
            }

            // ==========================================
            // 2. Láº¤Y GIá»Ž HÃ€NG
            // ==========================================
            const cart = await this.cartService.getCartByContext(sessionId, userId, transaction);
            let matchingCartItem: CartItems | null;

            // ==========================================
            // 3. TÃŒM KIáº¾M TRÃ™NG Láº¶P
            // ==========================================
            if (isCombo) {
                matchingCartItem = await this.matchingComboCartItem(
                    cart.id,
                    comboId,
                    finalComboOptions
                );
            } else {
                matchingCartItem = await this.matchingRegularCartItem(
                    cart.id,
                    productId!,
                    productVariantId!,
                    finalSingleProductOptions,
                    transaction
                );
            }

            // ==========================================
            // 4. Xá»¬ LÃ Káº¾T QUáº¢
            // ==========================================
            if (matchingCartItem) {
                // === TRÆ¯á»œNG Há»¢P A: ÄÃƒ CÃ“ -> TÄ‚NG Sá» LÆ¯á»¢NG ===
                await matchingCartItem.increment('quantity', {
                    by: quantity,
                    transaction
                });

                if (!isCombo && finalSingleProductOptions.length > 0) {
                    for (const opt of finalSingleProductOptions) {
                        const totalIngredientToAdd = quantity * opt.quantity;
                        await this.modelCartItemIngredient.increment(
                            { quantity: totalIngredientToAdd },
                            {
                                where: {
                                    cartItemId: matchingCartItem.id,
                                    ingredientId: opt.ingredientId,
                                    type: opt.type
                                },
                                transaction
                            }
                        );
                    }
                }

                // Reload data
                await matchingCartItem.reload({
                    include: [
                        {
                            model: this.modelCartItemIngredient,
                            attributes: ['ingredientId', 'quantity', 'type']
                        },
                        {
                            model: this.modelCartItemComboOption,
                            include: [{
                                model: this.modelCartItemComboOptionIngredient,
                                attributes: ['ingredientId', 'quantity', 'type']
                            }]
                        }
                    ],
                    transaction
                });

                await transaction.commit();
                return {
                    message: 'ÄÃ£ tÄƒng sá»‘ lÆ°á»£ng thÃ nh cÃ´ng!',
                    data: matchingCartItem
                };
            }
            else {
                // === TRÆ¯á»œNG Há»¢P B: CHÆ¯A CÃ“ -> Táº O Má»šI ===

                const newCartItem = await this.modelCartItems.create({
                    cartId: cart.id,
                    productId: isCombo ? null : productId,
                    productVariantId: isCombo ? null : productVariantId,
                    comboId: isCombo ? comboId : null,
                    quantity: quantity,
                } as any, { transaction });

                if (!isCombo && finalSingleProductOptions.length > 0) {
                    const ingredientsToCreate: any[] = finalSingleProductOptions.map(opt => ({
                        cartItemId: newCartItem.id,
                        ingredientId: opt.ingredientId,
                        quantity: quantity * opt.quantity,
                        type: opt.type
                    }))

                    await this.modelCartItemIngredient.bulkCreate(
                        ingredientsToCreate,
                        { transaction }
                    );
                }

                if (isCombo && finalComboOptions.length > 0) {
                    await this.createComboOptionsForCartItem(newCartItem.id, finalComboOptions, transaction);
                }

                // Reload data
                await newCartItem.reload({
                    include: [
                        {
                            model: this.modelCartItemIngredient,
                            attributes: ['ingredientId', 'quantity', 'type']
                        },
                        {
                            model: this.modelCartItemComboOption,
                            include: [{
                                model: this.modelCartItemComboOptionIngredient,
                                attributes: ['ingredientId', 'quantity', 'type']
                            }]
                        }
                    ],
                    transaction
                });

                await transaction.commit()
                return {
                    message: 'ThÃªm vÃ o giá» hÃ ng thÃ nh cÃ´ng!',
                    data: newCartItem
                };
            }

        } catch (error: any) {
            console.error(error);
            if (!(transaction as any).finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }
    /**
     * TÃ¬m cart item mÃ³n láº» khá»›p chÃ­nh xÃ¡c
     */
    async matchingRegularCartItem(
        cartId: number,
        productId: number,
        productVariantId: number,
        ingredients: NormalizedIngredientOption[],
        transaction: any
    ): Promise<CartItems | null> {

        const candidates = await this.modelCartItems.findAll({
            where: { cartId, productId, productVariantId, comboId: null },
            include: [{
                model: this.modelCartItemIngredient,
                attributes: ['ingredientId', 'quantity', 'type']
            }],
            transaction
        });

        if (candidates.length === 0) return null;

        // Payload gá»­i lÃªn lÃ  cáº¥u hÃ¬nh cho 1 sáº£n pháº©m (VD: 2 Cheese)
        const normalizedPayload = this.normalizeIngredients(ingredients);
        const payloadSignature = JSON.stringify(normalizedPayload);

        for (const item of candidates) {
            const normalizedDbData = this.normalizeIngredients(
                this.normalizeRegularIngredientsFromDb(item.dataValues.quantity, item.dataValues.cartItemIngredients || [])
            );
            const dbSignature = JSON.stringify(normalizedDbData);

            if (payloadSignature === dbSignature) {
                return item;
            }
        }

        return null;
    }


    private normalizeIngredients(ingredients: NormalizedIngredientOption[]): NormalizedIngredientOption[] {
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) return [];

        return ingredients
            .map(ing => ({
                ingredientId: Number(ing.ingredientId), // Ã‰p kiá»ƒu Number
                quantity: Number(ing.quantity),         // Ã‰p kiá»ƒu Number
                type: String(ing.type) as 'ADD' | 'REMOVE'
            }))
            .sort((a, b) => {
                if (a.ingredientId !== b.ingredientId) return a.ingredientId - b.ingredientId;
                return a.type.localeCompare(b.type);
            });
    }

    private normalizeRegularIngredientsFromDb(
        itemQuantity: number,
        cartItemIngredients: CartItemsIngredient[]
    ): NormalizedIngredientOption[] {
        return (cartItemIngredients || []).map(ing => {
            const totalQty = Number(ing.dataValues.quantity || 0);
            const unitQty = itemQuantity > 0 ? totalQty / Number(itemQuantity) : totalQty;

            return {
                ingredientId: Number(ing.dataValues.ingredientId),
                quantity: Number(unitQty),
                type: String(ing.dataValues.type) as 'ADD' | 'REMOVE'
            };
        });
    }

    private async normalizeSingleProductOptionsForCart(
        productId: number,
        options: NormalizedIngredientOption[],
        transaction: any
    ): Promise<NormalizedIngredientOption[]> {
        if (!options || options.length === 0) return [];

        const ingredientIds = Array.from(new Set(options.map(option => Number(option.ingredientId))));
        const [ingredients, productIngredients] = await Promise.all([
            this.modelIngredient.findAll({
                where: { id: ingredientIds },
                attributes: ['id'],
                transaction
            }),
            this.modelProductIngredient.findAll({
                where: { productId, ingredientId: ingredientIds },
                attributes: ['ingredientId'],
                transaction
            })
        ]);

        const existingIngredientIds = new Set(ingredients.map(ingredient => Number(ingredient.id)));
        const allowedIngredientIds = new Set(productIngredients.map(productIngredient => Number(productIngredient.dataValues.ingredientId)));
        const seenKeys = new Set<string>();

        const normalizedOptions = options.map(option => {
            const ingredientId = Number(option.ingredientId);
            const quantity = Number(option.quantity);
            const type = String(option.type) as 'ADD' | 'REMOVE';
            const key = `${ingredientId}:${type}`;

            if (seenKeys.has(key)) {
                throw new BadRequestException(`Duplicate ingredient ${ingredientId} (${type}) trong cÃ¹ng sáº£n pháº©m!`);
            }
            seenKeys.add(key);

            if (!existingIngredientIds.has(ingredientId)) {
                throw new BadRequestException(`Ingredient ${ingredientId} khÃ´ng tá»“n táº¡i!`);
            }
            if (!allowedIngredientIds.has(ingredientId)) {
                throw new BadRequestException(`Ingredient ${ingredientId} khÃ´ng há»£p lá»‡ cho sáº£n pháº©m ${productId}!`);
            }
            if (!['ADD', 'REMOVE'].includes(type)) {
                throw new BadRequestException(`Type ingredient khÃ´ng há»£p lá»‡!`);
            }
            if (quantity <= 0) {
                throw new BadRequestException('Sá»‘ lÆ°á»£ng ingredient pháº£i lá»›n hÆ¡n 0!');
            }

            return {
                ingredientId,
                quantity,
                type
            };
        });

        return this.normalizeIngredients(normalizedOptions);
    }
    /**
     * TÃ¬m combo cart item khá»›p chÃ­nh xÃ¡c
     */
    async matchingComboCartItem(
        cartId: number,
        comboId: number,
        comboOptions: NormalizedComboCartOption[]
    ): Promise<CartItems | null> {
        const candidates = await this.modelCartItems.findAll({
            where: {
                cartId: cartId,
                comboId: comboId
            },
            include: [{
                model: this.modelCartItemComboOption,
                required: false,
                include: [{
                    model: this.modelCartItemComboOptionIngredient,
                    required: false,
                    attributes: ['ingredientId', 'quantity', 'type']
                }]
            }]
        })

        if (candidates.length === 0) return null;

        const normalizedPayload = this.normalizeComboOptions(comboOptions);
        const payloadSignature = JSON.stringify(normalizedPayload);

        for (const item of candidates) {
            const dbOptions = item.dataValues.comboOptions || [];
            const normalizedDbOptions = dbOptions.map(option => ({
                comboItemId: Number(option.dataValues.comboItemId),
                slotIndex: Number(option.dataValues.slotIndex),
                productId: Number(option.dataValues.selectedProductId),
                productVariantId: Number(option.dataValues.selectedProductVariantId),
                ingredients: (option.dataValues.ingredients || []).map(ingredient => ({
                    ingredientId: Number(ingredient.dataValues.ingredientId),
                    quantity: Number(ingredient.dataValues.quantity),
                    type: String(ingredient.dataValues.type) as 'ADD' | 'REMOVE'
                }))
            }));

            const normalizedDbData = this.normalizeComboOptions(normalizedDbOptions);
            const dbSignature = JSON.stringify(normalizedDbData);

            if (payloadSignature === dbSignature) {
                return item;
            }
        }

        return null
    }
    /**
 * Normalize combo options Ä‘á»ƒ so sÃ¡nh (deep sort)
 */
    private normalizeComboOptions(options: any[]): any[] {
        if (!options || !Array.isArray(options) || options.length === 0) return [];

        // 1. Deep copy Ä‘á»ƒ trÃ¡nh mutate dá»¯ liá»‡u gá»‘c
        const clonedOptions = JSON.parse(JSON.stringify(options));

        return clonedOptions
            .map(opt => {
                // Chuáº©n hÃ³a Ingredients: LuÃ´n tráº£ vá» máº£ng (empty náº¿u khÃ´ng cÃ³)
                const rawIngredients = Array.isArray(opt.ingredients) ? opt.ingredients : [];

                const normalizedIngredients = rawIngredients
                    .filter(ing => ing && ing.ingredientId) // Lá»c rÃ¡c
                    .map(ing => ({
                        ingredientId: Number(ing.ingredientId), // Ã‰p kiá»ƒu Number cho cháº¯c
                        quantity: Number(ing.quantity),
                        type: String(ing.type) // Ã‰p kiá»ƒu String
                    }))
                    .sort((a, b) => {
                        if (a.ingredientId !== b.ingredientId) return a.ingredientId - b.ingredientId;
                        return a.type.localeCompare(b.type);
                    });

                return {
                    comboItemId: Number(opt.comboItemId),
                    slotIndex: Number(opt.slotIndex || 0),
                    productId: Number(opt.productId),
                    productVariantId: Number(opt.productVariantId),
                    ingredients: normalizedIngredients // LuÃ´n luÃ´n cÃ³ key ingredients
                };
            })
            .sort((a, b) => {
                if (a.comboItemId !== b.comboItemId) return a.comboItemId - b.comboItemId;
                if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
                if (a.productId !== b.productId) return a.productId - b.productId;
                if (a.productVariantId !== b.productVariantId) return a.productVariantId - b.productVariantId;
                return 0;
            });
    }

    private async normalizeComboOptionsForCartLegacyUnused(
        comboId: number,
        options: ComboOptionDto[],
        transaction: any
    ): Promise<NormalizedComboCartOption[]> {
        if (!options || options.length === 0) return [];

        const variantIds = options.map(option => Number(option.productVariantId));
        const allIngredientIds = options.flatMap(option =>
            (option.ingredients || []).map(ingredient => Number(ingredient.ingredientId))
        );

        const [variants, ingredients] = await Promise.all([
            this.modelProductVariant.findAll({
                where: { id: variantIds },
                transaction
            }),
            allIngredientIds.length > 0
                ? this.modelIngredient.findAll({
                    where: { id: allIngredientIds },
                    transaction
                })
                : []
        ]);

        const variantMap = new Map(variants.map(variant => [Number(variant.id), variant]));
        const ingredientMap = new Set(ingredients.map(ingredient => Number(ingredient.id)));
        const canonicalProductIds = Array.from(new Set(variants.map(variant => Number(variant.productId))));
        const products = await this.modelProduct.findAll({
            where: { id: canonicalProductIds },
            attributes: ['id', 'isActive'],
            transaction
        });
        const productMap = new Map(products.map(product => [Number(product.id), product]));

        const comboSlots = await this.getComboSlots(comboId, transaction);
        const usedSlotKeys = new Set<string>();
        const normalizedOptions: NormalizedComboCartOption[] = [];

        for (const [index, option] of options.entries()) {
            const variantId = Number(option.productVariantId);
            const variant = variantMap.get(variantId);

            if (!variant) {
                throw new BadRequestException(`BiÃ¡ÂºÂ¿n thÃ¡Â»Æ’ ${variantId} khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i!`);
            }
            if (variant.isActive === false) {
                throw new BadRequestException(`BiÃ¡ÂºÂ¿n thÃ¡Â»Æ’ ${variantId} Ã„â€˜ÃƒÂ£ ngÃ†Â°ng kinh doanh!`);
            }
            if (false) {
                throw new BadRequestException(`BiÃ¡ÂºÂ¿n thÃ¡Â»Æ’ ${variantId} khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡ Ã„â€˜Ã¡Â»Æ’ dÃƒÂ¹ng trong combo!`);
            }

            const canonicalProductId = Number(variant.productId);
            const requestedProductId = Number(option.productId);
            const product = productMap.get(canonicalProductId);
            if (!product) {
                throw new BadRequestException(`SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m ${canonicalProductId} khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i!`);
            }
            if (product.isActive === false) {
                throw new BadRequestException(`SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m ${canonicalProductId} Ã„â€˜ÃƒÂ£ ngÃ†Â°ng kinh doanh!`);
            }

            const seenIngredientIds = new Set<number>();
            const normalizedIngredients = (option.ingredients || []).map(ingredient => {
                const ingredientId = Number(ingredient.ingredientId);
                const quantity = Number(ingredient.quantity);
                const type = String(ingredient.type) as 'ADD' | 'REMOVE';

                if (seenIngredientIds.has(ingredientId)) {
                    throw new BadRequestException(`Duplicate ingredient ${ingredientId} trong mÃ¡Â»â„¢t mÃƒÂ³n!`);
                }
                seenIngredientIds.add(ingredientId);

                if (!ingredientMap.has(ingredientId)) {
                    throw new BadRequestException(`Ingredient ${ingredientId} khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i!`);
                }
                if (!['ADD', 'REMOVE'].includes(type)) {
                    throw new BadRequestException(`Type ingredient khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡!`);
                }
                if (quantity <= 0) {
                    throw new BadRequestException(`SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng ingredient phÃ¡ÂºÂ£i lÃ¡Â»â€ºn hÃ†Â¡n 0!`);
                }

                return {
                    ingredientId,
                    quantity,
                    type
                };
            });

            const slot = this.resolveComboSlotLegacyUnused(comboSlots, option, variant, index, usedSlotKeys, requestedProductId);
            usedSlotKeys.add(this.comboSlotKey(slot.comboItemId, slot.slotIndex));

            const isDefaultSelection =
                slot.productId === canonicalProductId &&
                slot.productVariantId === variantId &&
                normalizedIngredients.length === 0;

            if (!isDefaultSelection) {
                normalizedOptions.push({
                    comboItemId: slot.comboItemId,
                    slotIndex: slot.slotIndex,
                    productId: canonicalProductId,
                    productVariantId: variantId,
                    ingredients: normalizedIngredients
                });
            }
        }

        return normalizedOptions;
    }

    private comboSlotKey(comboItemId: number, slotIndex: number): string {
        return `${comboItemId}:${slotIndex}`;
    }

    private async getComboSlots(comboId: number, transaction: any): Promise<ComboSlot[]> {
        const comboItems = await this.modelComboItem.findAll({
            where: { comboId },
            order: [['id', 'ASC']],
            transaction
        });

        const slots: ComboSlot[] = [];
        for (const item of comboItems) {
            const qty = Number(item.quantity || 1);
            for (let slotIndex = 0; slotIndex < qty; slotIndex++) {
                slots.push({
                    comboItemId: Number(item.id),
                    slotIndex,
                    productId: Number(item.productId),
                    productVariantId: Number(item.productVariantId)
                });
            }
        }

        return slots;
    }

    private resolveComboSlotLegacyUnused(
        slots: ComboSlot[],
        option: ComboOptionDto,
        variant: ProductVariant,
        optionIndex: number,
        usedSlotKeys: Set<string>,
        requestedProductId: number
    ): ComboSlot {
        const comboItemId = Number(option.comboItemId || 0);
        const slotIndex = Number(option.slotIndex || 0);

        if (comboItemId > 0) {
            const explicitSlot = slots.find(slot => slot.comboItemId === comboItemId && slot.slotIndex === slotIndex);
            if (!explicitSlot) {
                throw new BadRequestException(`Combo item ${comboItemId} slot ${slotIndex} khÃ´ng há»£p lá»‡!`);
            }

            const key = this.comboSlotKey(explicitSlot.comboItemId, explicitSlot.slotIndex);
            if (usedSlotKeys.has(key)) {
                throw new BadRequestException(`Combo item ${comboItemId} slot ${slotIndex} bá»‹ trÃ¹ng!`);
            }

            return explicitSlot;
        }

        const availableSlots = slots.filter(slot => !usedSlotKeys.has(this.comboSlotKey(slot.comboItemId, slot.slotIndex)));
        const exactDefaultSlot = availableSlots.find(slot =>
            slot.productId === Number(variant.productId) &&
            slot.productVariantId === Number(variant.id)
        );
        if (exactDefaultSlot) return exactDefaultSlot;

        const requestedProductSlot = requestedProductId
            ? availableSlots.find(slot => slot.productId === requestedProductId)
            : null;
        if (requestedProductSlot) return requestedProductSlot;

        const indexSlot = availableSlots[optionIndex];
        if (indexSlot) return indexSlot;

        const firstSlot = availableSlots[0];
        if (firstSlot) return firstSlot;

        throw new BadRequestException('Cáº¥u hÃ¬nh combo khÃ´ng há»£p lá»‡!');
    }

    private async normalizeComboOptionsForCart(
        comboId: number,
        options: ComboOptionDto[],
        transaction: any
    ): Promise<NormalizedComboCartOption[]> {
        if (!options || options.length === 0) return [];

        const variantIds = options.map(option => Number(option.productVariantId));
        const allIngredientIds = options.flatMap(option =>
            (option.ingredients || []).map(ingredient => Number(ingredient.ingredientId))
        );

        const [variants, ingredients] = await Promise.all([
            this.modelProductVariant.findAll({
                where: { id: variantIds },
                transaction
            }),
            allIngredientIds.length > 0
                ? this.modelIngredient.findAll({
                    where: { id: allIngredientIds },
                    transaction
                })
                : []
        ]);

        const variantMap = new Map(variants.map(variant => [Number(variant.id), variant]));
        const ingredientMap = new Set(ingredients.map(ingredient => Number(ingredient.id)));
        const canonicalProductIds = Array.from(new Set(variants.map(variant => Number(variant.productId))));
        const [products, productIngredients] = await Promise.all([
            this.modelProduct.findAll({
                where: { id: canonicalProductIds },
                attributes: ['id', 'isActive'],
                transaction
            }),
            canonicalProductIds.length > 0
                ? this.modelProductIngredient.findAll({
                    where: { productId: canonicalProductIds },
                    attributes: ['productId', 'ingredientId'],
                    transaction
                })
                : Promise.resolve([] as ProductIngredient[])
        ]);
        const productMap = new Map(products.map(product => [Number(product.id), product]));
        const allowedIngredientMap = new Map<number, Set<number>>();
        productIngredients.forEach(productIngredient => {
            const productId = Number(productIngredient.dataValues.productId);
            if (!allowedIngredientMap.has(productId)) {
                allowedIngredientMap.set(productId, new Set<number>());
            }
            allowedIngredientMap.get(productId)?.add(Number(productIngredient.dataValues.ingredientId));
        });

        const comboSlots = await this.getComboSlots(comboId, transaction);
        const usedSlotKeys = new Set<string>();
        const normalizedOptions: NormalizedComboCartOption[] = [];

        for (const option of options) {
            const variantId = Number(option.productVariantId);
            const variant = variantMap.get(variantId);

            if (!variant) {
                throw new BadRequestException(`Biáº¿n thá»ƒ ${variantId} khÃ´ng tá»“n táº¡i!`);
            }
            if (variant.isActive === false) {
                throw new BadRequestException(`Biáº¿n thá»ƒ ${variantId} Ä‘Ã£ ngá»«ng kinh doanh!`);
            }

            const canonicalProductId = Number(variant.productId);
            const requestedProductId = Number(option.productId);
            if (requestedProductId !== canonicalProductId) {
                throw new BadRequestException(`Biáº¿n thá»ƒ ${variantId} khÃ´ng thuá»™c sáº£n pháº©m ${requestedProductId}!`);
            }

            const product = productMap.get(canonicalProductId);
            if (!product) {
                throw new BadRequestException(`Sáº£n pháº©m ${canonicalProductId} khÃ´ng tá»“n táº¡i!`);
            }
            if (product.isActive === false) {
                throw new BadRequestException(`Sáº£n pháº©m ${canonicalProductId} Ä‘Ã£ ngá»«ng kinh doanh!`);
            }

            const allowedIngredientIds = allowedIngredientMap.get(canonicalProductId) || new Set<number>();
            const seenIngredientKeys = new Set<string>();
            const normalizedIngredients = (option.ingredients || []).map(ingredient => {
                const ingredientId = Number(ingredient.ingredientId);
                const quantity = Number(ingredient.quantity);
                const type = String(ingredient.type) as 'ADD' | 'REMOVE';
                const ingredientKey = `${ingredientId}:${type}`;

                if (seenIngredientKeys.has(ingredientKey)) {
                    throw new BadRequestException(`Duplicate ingredient ${ingredientId} (${type}) trong má»™t mÃ³n!`);
                }
                seenIngredientKeys.add(ingredientKey);

                if (!ingredientMap.has(ingredientId)) {
                    throw new BadRequestException(`Ingredient ${ingredientId} khÃ´ng tá»“n táº¡i!`);
                }
                if (!allowedIngredientIds.has(ingredientId)) {
                    throw new BadRequestException(`Ingredient ${ingredientId} khÃ´ng há»£p lá»‡ cho sáº£n pháº©m ${canonicalProductId}!`);
                }
                if (!['ADD', 'REMOVE'].includes(type)) {
                    throw new BadRequestException(`Type ingredient khÃ´ng há»£p lá»‡!`);
                }
                if (quantity <= 0) {
                    throw new BadRequestException(`Sá»‘ lÆ°á»£ng ingredient pháº£i lá»›n hÆ¡n 0!`);
                }

                return {
                    ingredientId,
                    quantity,
                    type
                };
            });

            const slot = this.resolveComboSlot(comboSlots, option, usedSlotKeys);
            usedSlotKeys.add(this.comboSlotKey(slot.comboItemId, slot.slotIndex));

            const isDefaultSelection =
                slot.productId === canonicalProductId &&
                slot.productVariantId === variantId &&
                normalizedIngredients.length === 0;

            if (!isDefaultSelection) {
                normalizedOptions.push({
                    comboItemId: slot.comboItemId,
                    slotIndex: slot.slotIndex,
                    productId: canonicalProductId,
                    productVariantId: variantId,
                    ingredients: normalizedIngredients
                });
            }
        }

        return normalizedOptions;
    }

    private resolveComboSlot(
        slots: ComboSlot[],
        option: ComboOptionDto,
        usedSlotKeys: Set<string>
    ): ComboSlot {
        const comboItemId = Number(option.comboItemId);
        const slotIndex = Number(option.slotIndex);
        const explicitSlot = slots.find(slot => slot.comboItemId === comboItemId && slot.slotIndex === slotIndex);
        if (!explicitSlot) {
            throw new BadRequestException(`Combo item ${comboItemId} slot ${slotIndex} khÃ´ng há»£p lá»‡!`);
        }

        const key = this.comboSlotKey(explicitSlot.comboItemId, explicitSlot.slotIndex);
        if (usedSlotKeys.has(key)) {
            throw new BadRequestException(`Combo item ${comboItemId} slot ${slotIndex} bá»‹ trÃ¹ng!`);
        }

        return explicitSlot;
    }

    private async createComboOptionsForCartItem(
        cartItemId: number,
        options: NormalizedComboCartOption[],
        transaction: any
    ): Promise<void> {
        for (const option of options) {
            const createdOption = await this.modelCartItemComboOption.create({
                cartItemId,
                comboItemId: option.comboItemId,
                slotIndex: option.slotIndex,
                selectedProductId: option.productId,
                selectedProductVariantId: option.productVariantId
            } as any, { transaction });

            if (option.ingredients.length > 0) {
                await this.modelCartItemComboOptionIngredient.bulkCreate(
                    option.ingredients.map(ingredient => ({
                        cartItemComboOptionId: createdOption.id,
                        ingredientId: ingredient.ingredientId,
                        quantity: ingredient.quantity,
                        type: ingredient.type
                    })) as any,
                    { transaction }
                );
            }
        }
    }

    private async clearComboOptionsForCartItem(cartItemId: number, transaction: any): Promise<void> {
        const options = await this.modelCartItemComboOption.findAll({
            where: { cartItemId },
            attributes: ['id'],
            transaction
        });
        const optionIds = options.map(option => Number(option.id));

        if (optionIds.length > 0) {
            await this.modelCartItemComboOptionIngredient.destroy({
                where: { cartItemComboOptionId: optionIds },
                transaction
            });
        }

        await this.modelCartItemComboOption.destroy({
            where: { cartItemId },
            transaction
        });
    }

    private async clearComboOptionsForSlots(
        cartItemId: number,
        optionsToReplace: ComboOptionDto[],
        transaction: any
    ): Promise<void> {
        if (!optionsToReplace || optionsToReplace.length === 0) return;

        const slotKeys = new Set(
            optionsToReplace.map(option => this.comboSlotKey(
                Number(option.comboItemId),
                Number(option.slotIndex)
            ))
        );
        const existingOptions = await this.modelCartItemComboOption.findAll({
            where: { cartItemId },
            attributes: ['id', 'comboItemId', 'slotIndex'],
            transaction
        });
        const optionIds = existingOptions
            .filter(option => slotKeys.has(this.comboSlotKey(
                Number(option.dataValues.comboItemId),
                Number(option.dataValues.slotIndex)
            )))
            .map(option => Number(option.id));

        if (optionIds.length === 0) return;

        await this.modelCartItemComboOptionIngredient.destroy({
            where: { cartItemComboOptionId: optionIds },
            transaction
        });
        await this.modelCartItemComboOption.destroy({
            where: { id: optionIds },
            transaction
        });
    }

    private normalizeDbComboOptions(options: CartItemComboOption[]): NormalizedComboCartOption[] {
        return (options || []).map(option => ({
            comboItemId: Number(option.dataValues.comboItemId),
            slotIndex: Number(option.dataValues.slotIndex),
            productId: Number(option.dataValues.selectedProductId),
            productVariantId: Number(option.dataValues.selectedProductVariantId),
            ingredients: (option.dataValues.ingredients || []).map(ingredient => ({
                ingredientId: Number(ingredient.dataValues.ingredientId),
                quantity: Number(ingredient.dataValues.quantity),
                type: String(ingredient.dataValues.type) as 'ADD' | 'REMOVE'
            }))
        }));
    }

    /**
     * Validate cÃ¡c mÃ³n trong combo cÃ³ tá»“n táº¡i khÃ´ng
     */
    private async validateComboOptions(
        options: ComboOptionDto[],
        transaction: any
    ): Promise<void> {
        if (!options || options.length === 0) return;

        // 1. Gom táº¥t cáº£ ID
        const productIds = options.map(o => o.productId);
        const variantIds = options.map(o => o.productVariantId);

        const allIngredientIds: number[] = [];
        options.forEach(opt => {
            if (opt.ingredients) {
                opt.ingredients.forEach(ing => allIngredientIds.push(ing.ingredientId));
            }
        });

        // 2. Query song song
        const [products, variants, ingredients] = await Promise.all([
            this.modelProduct.findAll({
                where: { id: productIds },
                attributes: ['id'],
                transaction
            }),
            this.modelProductVariant.findAll({
                where: { id: variantIds },
                // KhÃ´ng cáº§n attributes, láº¥y all Ä‘á»ƒ check productId
                transaction
            }),
            allIngredientIds.length > 0
                ? this.modelIngredient.findAll({ where: { id: allIngredientIds }, transaction })
                : []
        ]);

        // 3. Convert sang Set/Map (Ã‰p kiá»ƒu Number cho Key Ä‘á»ƒ an toÃ n)
        const productMap = new Set(products.map(p => Number(p.id)));
        // Map: Key = VariantID, Value = Variant Instance
        const variantMap = new Map(variants.map(v => [Number(v.id), v]));
        const ingredientMap = new Set(ingredients.map(i => Number(i.id)));

        // 4. Validate Logic
        for (const option of options) {
            // Ã‰p kiá»ƒu input vá» Number
            const optProductId = Number(option.productId);
            const optVariantId = Number(option.productVariantId);

            // Check Product
            if (!productMap.has(optProductId)) {
                throw new BadRequestException(`Sáº£n pháº©m ${optProductId} khÃ´ng tá»“n táº¡i!`);
            }

            // Check Variant
            const variant = variantMap.get(optVariantId);
            if (!variant) {
                throw new BadRequestException(`Biáº¿n thá»ƒ ${optVariantId} khÃ´ng tá»“n táº¡i!`);
            }

            // ðŸ”¥ FIX QUAN TRá»ŒNG: Ã‰p kiá»ƒu khi so sÃ¡nh productId
            if (Number(variant.productId) !== optProductId) {
                throw new BadRequestException(
                    `Biáº¿n thá»ƒ ${optVariantId} khÃ´ng thuá»™c sáº£n pháº©m ${optProductId}! (DB: ${variant.productId})`
                );
            }

            // Check Ingredients
            if (option.ingredients && option.ingredients.length > 0) {
                const tempIngIds = new Set();
                for (const ing of option.ingredients) {
                    const ingId = Number(ing.ingredientId);
                    const ingQty = Number(ing.quantity);

                    if (tempIngIds.has(ingId)) {
                        throw new BadRequestException(`Duplicate ingredient ${ingId} trong má»™t mÃ³n!`);
                    }
                    tempIngIds.add(ingId);

                    if (!ingredientMap.has(ingId)) {
                        throw new BadRequestException(`Ingredient ${ingId} khÃ´ng tá»“n táº¡i!`);
                    }

                    if (!['ADD', 'REMOVE'].includes(ing.type)) {
                        throw new BadRequestException(`Type ingredient khÃ´ng há»£p lá»‡!`);
                    }
                    if (ingQty <= 0) {
                        throw new BadRequestException(`Sá»‘ lÆ°á»£ng ingredient pháº£i lá»›n hÆ¡n 0!`);
                    }
                }
            }
        }
    }

    /**
      * ðŸ”¥ HÃ€M Má»šI: Sinh options máº·c Ä‘á»‹nh tá»« cáº¥u hÃ¬nh ComboItem trong DB
      */
    private async generateDefaultComboOptions(
        comboId: number,
        transaction: any
    ): Promise<any[]> {
        // 1. Láº¥y cáº¥u hÃ¬nh cÃ¡c mÃ³n trong combo
        const comboItems = await this.modelComboItem.findAll({
            where: { comboId },
            transaction
        });

        if (!comboItems || comboItems.length === 0) {
            throw new BadGatewayException('Combo nÃ y chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh mÃ³n Äƒn (Empty ComboItem)!');
        }

        const generatedOptions: any[] = [];

        // 2. Map sang cáº¥u trÃºc JSON
        for (const item of comboItems) {
            // Quan trá»ng: Náº¿u quantity = 2 (VD: 2 lon Coca), ta pháº£i tÃ¡ch thÃ nh 2 object riÃªng biá»‡t
            // Ä‘á»ƒ sau nÃ y khÃ¡ch cÃ³ thá»ƒ Ä‘á»•i 1 lon Coca thÃ nh Sprite, lon kia giá»¯ nguyÃªn.
            const qty = item.quantity || 1;

            for (let i = 0; i < qty; i++) {
                generatedOptions.push({
                    productId: item.productId,
                    productVariantId: item.productVariantId, // Variant máº·c Ä‘á»‹nh (VD: Size M)
                    ingredients: [] // Máº·c Ä‘á»‹nh khÃ´ng cÃ³ topping thÃªm
                });
            }
        }

        // 3. Sáº¯p xáº¿p Ä‘á»ƒ Ä‘áº£m báº£o tÃ­nh nháº¥t quÃ¡n khi so sÃ¡nh chuá»—i (Matching)
        return generatedOptions.sort((a, b) => {
            if (a.productId !== b.productId) return a.productId - b.productId;
            return a.productVariantId - b.productVariantId;
        });
    }



    async increOrDecreQuantity(cartItemId: number, action: actionUpdateCartItem) {
        const transaction = await this.sequelize.transaction()
        try {
            const cartItem = await this.modelCartItems.findByPk(cartItemId, {
                transaction
            })

            if (!cartItem) {
                throw new BadGatewayException('Giá» hÃ ng khÃ³a chÆ°a Ä‘Æ°á»£c tÃ¬m tháº¥y!')
            }

            const currentQuantity = Number(cartItem.dataValues.quantity || 1);

            if (action === 'increment') {
                await cartItem.increment('quantity', {
                    by: 1,
                    transaction
                })

                const cartItemIngredient = await this.modelCartItemIngredient.findAll({
                    where: {
                        cartItemId: cartItem.dataValues.id
                    },
                    transaction
                })
                if (cartItemIngredient.length > 0) {
                    await Promise.all(cartItemIngredient.map(async (item) => {
                        const unitQty = currentQuantity > 0
                            ? Number(item.dataValues.quantity || 0) / currentQuantity
                            : Number(item.dataValues.quantity || 0);
                        await item.increment('quantity', {
                            by: unitQty,
                            transaction
                        })
                    }))
                }
                await cartItem.reload({ transaction });

                await transaction.commit()

                return {
                    message: 'ÄÃ£ tÄƒng sá»‘ lÆ°á»£ng thÃ nh cÃ´ng',
                    data: cartItem
                }
            } else if (action === 'decrement') {

                if (cartItem.dataValues.quantity <= 1) {
                    await this.modelCartItemIngredient.destroy({ where: { cartItemId: cartItem.dataValues.id }, transaction })

                    await cartItem.destroy({
                        transaction
                    })

                    await transaction.commit()

                    return {
                        message: 'ÄÃ£ xÃ³a sáº£n pháº©m thÃ nh cÃ´ng'
                    }
                }
                await cartItem.decrement('quantity', {
                    by: 1,
                    transaction
                })

                const cartItemIngredient = await this.modelCartItemIngredient.findAll({
                    where: {
                        cartItemId: cartItem.dataValues.id
                    },
                    transaction
                })
                if (cartItemIngredient.length > 0) {
                    await Promise.all(cartItemIngredient.map(async (item) => {
                        const unitQty = currentQuantity > 0
                            ? Number(item.dataValues.quantity || 0) / currentQuantity
                            : Number(item.dataValues.quantity || 0);
                        await item.decrement('quantity', {
                            by: unitQty,
                            transaction
                        })
                    }))
                }
                await cartItem.reload({ transaction });

                await transaction.commit()

                return {
                    message: 'ÄÃ£ giáº£m sá»‘ lÆ°á»£ng thÃ nh cÃ´ng',
                    data: cartItem
                }
            }
        } catch (error: any) {
            console.log(error);
            await transaction.rollback()
            throw error
        }
    }

    async deleteCartItem(
        cartItemId: number,
        userId?: number | null,
        sessionId?: string
    ) {
        const transaction = await this.sequelize.transaction()
        try {
            const cartItem = await this.modelCartItems.findByPk(cartItemId, { transaction })

            if (!cartItem) {
                throw new NotFoundException('Cart item khÃ´ng tá»“n táº¡i!')
            }

            const cart = await this.modelCarts.findByPk(cartItem.cartId, { transaction })

            if (!cart) {
                throw new NotFoundException('Cart khÃ´ng tá»“n táº¡i!')
            }

            const isOwner = (userId && cart.userId === userId) ||
                (sessionId && cart.sessionId === sessionId)

            if (!isOwner) {
                throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a cart item nÃ y!')
            }

            await cartItem.destroy({
                transaction
            })
            await transaction.commit()

            return {
                message: 'ÄÃ£ xÃ³a sáº£n pháº©m trong giá» hÃ ng'
            }
        } catch (error: any) {
            console.log(error);
            await transaction.rollback()
            throw error
        }
    }


    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * TÃ¬m cart item khá»›p chÃ­nh xÃ¡c vá»›i product + variant + ingredients
     */
    async matchingCartItem(cartId: number, productId: number, productVariantId: number, ingredientIds: number[]): Promise<CartItems | null> {

        const matchesCartItem = await this.modelCartItems.findAll({
            where: {
                cartId: cartId,
                productId: productId,
                productVariantId: productVariantId
            }
        })

        if (matchesCartItem.length === 0 || !matchesCartItem) return null

        const sortIngredientIds = [...ingredientIds].sort((a, b) => a - b);

        for (const item of matchesCartItem) {
            const matchesCartItemIngredient = await this.modelCartItemIngredient.findAll({
                where: {
                    cartItemId: item.id
                },
                attributes: ['ingredientId']
            })
            const sortmatchesCartItemIngredient = [...matchesCartItemIngredient].map((ingredient) => ingredient.get('ingredientId')).sort((a, b) => a - b);

            if (Helper.isEqualArray(sortIngredientIds, sortmatchesCartItemIngredient)) {
                return item
            }
        }

        return null
    }


    /**
     * TÃ¬m cart item cÃ³ cÃ¹ng productId + productVariantId nhÆ°ng KHÃ”NG cÃ³ ingredients
     */
    async findCartItemWithoutIngredients(
        cartId: number,
        productId: number,
        productVariantId: number
    ): Promise<CartItems | null> {

        return await this.modelCartItems.findOne({
            where: {
                cartId: cartId,
                productId: productId,
                productVariantId: productVariantId
            },
            include: [{
                model: this.modelCartItemIngredient,
                required: false, // LEFT JOIN
                attributes: []
            }],
            having: this.sequelize.where(
                this.sequelize.fn('COUNT', this.sequelize.col('cartItemIngredients.id')),
                0
            ),
            group: ['CartItems.id']
        });
    };

    async mergerCart(sessionId: string, userId: number) {
        // 1. DÃ¹ng transaction Ä‘á»ƒ Ä‘áº£m báº£o an toÃ n
        const transaction = await this.sequelize.transaction();

        try {
            // ---------------------------------------------------------
            // BÆ¯á»šC 1: Láº¤Y GUEST CART (KÃˆM FULL THÃ”NG TIN)
            // ---------------------------------------------------------
            // QUAN TRá»ŒNG: Pháº£i include cáº£ CartItemsIngredient Ä‘á»ƒ check mÃ³n láº»
            const guestCart = await this.modelCarts.findOne({
                where: { sessionId: sessionId },
                include: [
                    {
                        model: this.modelCartItems,
                        include: [
                            { model: this.modelCartItemIngredient },
                            {
                                model: this.modelCartItemComboOption,
                                include: [{ model: this.modelCartItemComboOptionIngredient }]
                            }
                        ]
                    }
                ],
                transaction
            });

            // Náº¿u khÃ´ng cÃ³ giá» guest -> KhÃ´ng lÃ m gÃ¬ cáº£, return luÃ´n (Äá»«ng throw lá»—i)
            // VÃ¬ user má»›i login cÃ³ thá»ƒ chÆ°a tá»«ng thÃªm gÃ¬ vÃ o giá»
            if (!guestCart) {
                await transaction.commit();
                return { message: 'KhÃ´ng cÃ³ giá» hÃ ng khÃ¡ch Ä‘á»ƒ merge.' };
            }

            const userCart = await this.cartService.getOrCreateUserCart(userId, transaction);
            const userCartId = userCart.dataValues.id;

            // ---------------------------------------------------------
            // BÆ¯á»šC 2: DUYá»†T Tá»ªNG MÃ“N BÃŠN GUEST Äá»‚ Xá»¬ LÃ
            // ---------------------------------------------------------
            for (const guestItem of guestCart.dataValues.cartItems) {
                let matchingUserItem: CartItems | null = null;

                // --- TRÆ¯á»œNG Há»¢P A: COMBO ---
                if (guestItem.comboId) {
                    // Gá»i láº¡i hÃ m check trÃ¹ng Combo mÃ¬nh Ä‘Ã£ viáº¿t á»Ÿ CartItemService
                    // (Giáº£ sá»­ báº¡n Ä‘ang á»Ÿ trong CartService, cáº§n inject CartItemService hoáº·c copy logic Ä‘Ã³ sang)
                    matchingUserItem = await this.matchingComboCartItem(
                        userCartId,
                        guestItem.comboId,
                        this.normalizeDbComboOptions(guestItem.comboOptions || [])
                    );
                }
                // --- TRÆ¯á»œNG Há»¢P B: MÃ“N Láºº ---
                else if (guestItem.productId) {
                    const guestIngredientOptions = this.normalizeRegularIngredientsFromDb(
                        Number(guestItem.quantity || 1),
                        guestItem.cartItemIngredients || []
                    );

                    matchingUserItem = await this.matchingRegularCartItem(
                        userCartId,
                        guestItem.productId,
                        guestItem.productVariantId,
                        guestIngredientOptions,
                        transaction
                    );
                }

                // ---------------------------------------------------------
                // BÆ¯á»šC 3: QUYáº¾T Äá»ŠNH MERGE HAY MOVE
                // ---------------------------------------------------------

                if (matchingUserItem) {
                    // === TÃŒNH HUá»NG 1: ÄÃƒ CÃ“ TRÃ™NG KHá»šP (MERGE) ===

                    // 1. Cá»™ng dá»“n sá»‘ lÆ°á»£ng vÃ o item cá»§a User
                    await matchingUserItem.increment('quantity', {
                        by: guestItem.quantity,
                        transaction
                    });

                    // 2. Náº¿u lÃ  mÃ³n láº», pháº£i cá»™ng dá»“n cáº£ sá»‘ lÆ°á»£ng Topping trong báº£ng phá»¥
                    if (!guestItem.comboId && guestItem.cartItemIngredients?.length > 0) {
                        // Logic: TÃ¬m cÃ¡c dÃ²ng ingredient tÆ°Æ¡ng á»©ng cá»§a UserItem vÃ  cá»™ng thÃªm
                        // (Äá»ƒ Ä‘Æ¡n giáº£n, ta giáº£ Ä‘á»‹nh ingredient giá»‘ng há»‡t nhau thÃ¬ bulk update hoáº·c loop update)
                        for (const guestIng of guestItem.cartItemIngredients) {
                            await this.modelCartItemIngredient.increment(
                                { quantity: guestIng.quantity }, // Cá»™ng thÃªm sá»‘ lÆ°á»£ng tá»« guest
                                {
                                    where: {
                                        cartItemId: matchingUserItem.id,
                                        ingredientId: guestIng.ingredientId
                                    },
                                    transaction
                                }
                            );
                        }
                    }

                    // 3. XÃ³a item bÃªn Guest (vÃ¬ Ä‘Ã£ cá»™ng dá»“n sang User rá»“i)
                    await guestItem.destroy({ transaction });

                } else {
                    // === TÃŒNH HUá»NG 2: CHÆ¯A CÃ“ (MOVE) ===
                    // ÄÃ¢y lÃ  cÃ¡ch tá»‘i Æ°u nháº¥t: Chá»‰ cáº§n Ä‘á»•i chá»§ sá»Ÿ há»¯u (cartId)

                    await guestItem.update(
                        { cartId: userCartId },
                        { transaction }
                    );

                    // LÆ°u Ã½: CÃ¡c báº£ng phá»¥ (CartItemsIngredient) sáº½ tá»± Ä‘á»™ng Ä‘i theo
                    // vÃ¬ chÃºng liÃªn káº¿t vá»›i CartItemId, mÃ  ID nÃ y khÃ´ng Ä‘á»•i, chá»‰ Ä‘á»•i cartId cha.
                }
            }

            // ---------------------------------------------------------
            // BÆ¯á»šC 4: Dá»ŒN Dáº¸P
            // ---------------------------------------------------------
            // XÃ³a vá» giá» hÃ ng Guest (Item bÃªn trong Ä‘Ã£ bá»‹ xÃ³a hoáº·c di chuyá»ƒn háº¿t rá»“i)
            await this.modelCarts.destroy({
                where: { id: guestCart.id },
                transaction
            });

            await transaction.commit();
            return {
                message: 'Äá»“ng bá»™ giá» hÃ ng thÃ nh cÃ´ng!',
            };

        } catch (error: any) {
            console.log(error);
            if (!(transaction as any).finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    async getCartItemsById(idCart: number) {
        return await this.modelCartItems.findByPk(idCart);
    }

    async getCartItemByCartId(cartId: number, transaction: any): Promise<any> {
        const cartItems = await this.modelCartItems.findAll({
            where: {
                cartId: cartId
            },
            include: [
                {
                    model: this.modelProduct,
                    attributes: ['name', 'basePrice', 'imageUrl']
                },
                {
                    model: this.modelProductVariant,
                    attributes: ['id', 'name', 'size', 'type', 'modifiedPrice']
                },
                {
                    model: this.modelCartItemIngredient,
                    attributes: ['id', 'ingredientId', 'quantity'],
                    include: [
                        {
                            model: this.modelIngredient,
                            attributes: ['name', 'description', 'imageUrl', 'price']
                        }
                    ]
                }
            ],
            transaction
        })
        const summary = cartItems.map((item) => {
            const cartItem = item.toJSON();

            const priceProduct = cartItem.productVariant.modifiedPrice ?? cartItem.product.basePrice;

            const cartIngredient = cartItem.cartItemIngredients
            let priceIngredient: number = 0
            for (let ingredient of cartIngredient) {
                priceIngredient += ingredient.ingredient.price * ingredient.quantity
            }

            return {
                ...cartItem,
                subTotal: (priceProduct + priceIngredient) * cartItem.quantity
            }
        })
        return {
            message: 'Láº¥y cartItem thanh cong',
            data: summary
        }
    }

    // cart-item.service.ts

    async updateCartItem(
        cartItemId: number,
        updateData: UpdateCartItemDto,
        userId?: number | null,
        sessionId?: string
    ): Promise<{ message: string; data: any }> {
        const transaction = await this.sequelize.transaction();
        let cartIdForPreview = 0;

        try {
            // 1. TÃŒM CART ITEM
            const cartItem = await this.modelCartItems.findByPk(cartItemId, {
                include: [
                    {
                        model: this.modelCarts,
                        required: true,
                    }
                ],
                transaction
            });

            if (!cartItem) {
                throw new NotFoundException('Cart item khÃ´ng tá»“n táº¡i!');
            }

            // 2. KIá»‚M TRA QUYá»€N Sá»ž Há»®U
            const cart = cartItem.dataValues.cart || cartItem.cart || await this.modelCarts.findByPk(cartItem.cartId, { transaction });
            if (!cart) {
                throw new NotFoundException('Cart khong ton tai!');
            }
            const cartData = cart.dataValues || cart;
            const isOwner = (userId && Number(cartData.userId) === Number(userId)) ||
                (sessionId && cartData.sessionId === sessionId);

            if (!isOwner) {
                throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n chá»‰nh sá»­a cart item nÃ y!');
            }

            const isCombo = !!cartItem.comboId;
            const originalQuantity = Number(cartItem.quantity || 1);
            cartIdForPreview = Number(cartData.id || cartItem.cartId);

            if (updateData.type === UPDATE_CART_ITEM_TYPE.COMBO && !isCombo) {
                throw new BadRequestException('Cart item nÃ y khÃ´ng pháº£i lÃ  combo!');
            }

            if (updateData.type === UPDATE_CART_ITEM_TYPE.SINGLE && isCombo) {
                throw new BadRequestException('Cart item nÃ y khÃ´ng pháº£i lÃ  mÃ³n láº»!');
            }

            if (isCombo && (updateData.productVariantId !== undefined || updateData.singleProductOptions !== undefined)) {
                throw new BadRequestException('Combo item khÃ´ng Ä‘Æ°á»£c update productVariantId hoac singleProductOptions!');
            }

            if (!isCombo && updateData.comboOptions !== undefined) {
                throw new BadRequestException('MÃ³n láº» khÃ´ng Ä‘Æ°á»£c update comboOptions!');
            }

            // 3. UPDATE QUANTITY (náº¿u cÃ³)
            if (updateData.quantity !== undefined) {
                if (updateData.quantity <= 0) {
                    throw new BadRequestException('Sá»‘ lÆ°á»£ng pháº£i lá»›n hÆ¡n 0!');
                }
                cartItem.quantity = updateData.quantity;
            }

            // 4. UPDATE COMBO
            if (isCombo && updateData.comboOptions !== undefined) {
                if (updateData.comboOptions.length === 0) {
                    await this.clearComboOptionsForCartItem(cartItem.id, transaction);
                } else {
                    const normalizedOptions = await this.normalizeComboOptionsForCart(
                        Number(cartItem.comboId),
                        updateData.comboOptions,
                        transaction
                    );

                    await this.clearComboOptionsForSlots(cartItem.id, updateData.comboOptions, transaction);
                    if (normalizedOptions.length > 0) {
                        await this.createComboOptionsForCartItem(cartItem.id, normalizedOptions, transaction);
                    }
                }
            }

            // 5. UPDATE SINGLE PRODUCT
            // 5. UPDATE SINGLE PRODUCT
            if (!isCombo) {
                // Update variant (náº¿u cÃ³)
                if (updateData.productVariantId !== undefined) {
                    const variant = await this.modelProductVariant.findByPk(updateData.productVariantId, { transaction });
                    if (!variant) {
                        throw new BadRequestException('Variant khÃ´ng tá»“n táº¡i!');
                    }

                    // Kiá»ƒm tra variant cÃ³ thuá»™c product nÃ y khÃ´ng
                    if (variant.isActive === false) {
                        throw new BadRequestException('Variant da ngung kinh doanh!');
                    }

                    if (Number(variant.productId) !== Number(cartItem.productId)) {
                        throw new BadRequestException('Variant khÃ´ng thuá»™c product nÃ y!');
                    }

                    cartItem.productVariantId = updateData.productVariantId;
                }

                // Update ingredients (náº¿u cÃ³)
                if (updateData.singleProductOptions !== undefined) {
                    const normalizedOptions = await this.normalizeSingleProductOptionsForCart(
                        Number(cartItem.productId),
                        updateData.singleProductOptions,
                        transaction
                    );

                    await this.modelCartItemIngredient.destroy({
                        where: { cartItemId: cartItem.id },
                        transaction
                    });

                    if (normalizedOptions.length > 0) {
                        const ingredientsToCreate = normalizedOptions.map(opt => ({
                            cartItemId: cartItem.id,
                            ingredientId: opt.ingredientId,
                            quantity: cartItem.quantity * opt.quantity,
                            type: opt.type as 'ADD' | 'REMOVE'
                        }));

                        await this.modelCartItemIngredient.bulkCreate(
                            ingredientsToCreate as any,
                            { transaction }
                        );
                    }
                } else if (updateData.quantity !== undefined && originalQuantity !== Number(cartItem.quantity)) {
                    const existingIngredients = await this.modelCartItemIngredient.findAll({
                        where: { cartItemId: cartItem.id },
                        transaction
                    });

                    for (const ingredient of existingIngredients) {
                        const currentTotalQty = Number(ingredient.dataValues.quantity || 0);
                        const unitQty = originalQuantity > 0 ? currentTotalQty / originalQuantity : currentTotalQty;
                        ingredient.quantity = unitQty * Number(cartItem.quantity);
                        await ingredient.save({ transaction });
                    }
                }
            }
            // 6. SAVE CART ITEM
            await cartItem.save({ transaction });

            // 7. RELOAD WITH RELATIONS
            await cartItem.reload({
                include: [
                    {
                        model: this.modelCartItemIngredient,
                        include: [
                            {
                                model: this.modelIngredient,
                                attributes: ['id', 'name', 'price']
                            }
                        ]
                    },
                    {
                        model: this.modelCombo,
                        attributes: ['id', 'name', 'imageUrl', 'price']
                    },
                    {
                        model: this.modelCartItemComboOption,
                        include: [
                            {
                                model: this.modelCartItemComboOptionIngredient,
                                include: [
                                    {
                                        model: this.modelIngredient,
                                        attributes: ['id', 'name', 'price']
                                    }
                                ]
                            }
                        ]
                    }
                ],
                transaction
            });

            await transaction.commit();

            return {
                message: 'Cáº­p nháº­t cart item thÃ nh cÃ´ng!',
                data: (await this.cartPreviewService.getUserCartPreview(cartIdForPreview)).data
            };

        } catch (error: any) {
            console.error('âŒ Update cart item error:', error);
            if (!(transaction as any).finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }


}
