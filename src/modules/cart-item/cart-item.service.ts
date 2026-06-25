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
import { UpdateCartItemDto } from './dto/update-cart-item.dto.ts';
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
            selectedOptions // Có thể null/undefined nếu là Quick Add
        } = dataAdd;

        const transaction = await this.sequelize.transaction();

        try {
            if (quantity <= 0) {
                throw new BadGatewayException('Số lượng phải lớn hơn 0!!!');
            }

            const isCombo = !!comboId;

            // 🔥 Biến này sẽ chứa options cuối cùng để lưu vào DB (dù là user gửi hay tự sinh)
            let finalComboOptions: NormalizedComboCartOption[] = [];

            // ==========================================
            // 1. VALIDATION & PREPARATION
            // ==========================================
            if (isCombo) {
                if (!comboId) throw new BadGatewayException('Thiếu thông tin Combo ID!');

                const existedCombo = await this.modelCombo.findByPk(comboId, { transaction });
                if (!existedCombo) throw new BadGatewayException('Combo không tồn tại!');

                const hasExplicitComboSlots = selectedOptions?.some(option => Number(option.comboItemId || 0) > 0);
                if (selectedOptions && selectedOptions.length > 0 && hasExplicitComboSlots) {
                    finalComboOptions = await this.normalizeComboOptionsForCart(comboId, selectedOptions, transaction);
                }
            }
            else {
                // Logic sản phẩm lẻ (Giữ nguyên)
                if (!productId || !productVariantId) {
                    throw new BadGatewayException('Thiếu thông tin sản phẩm!');
                }
                const existedProduct = await this.modelProduct.findByPk(productId, { transaction });
                if (existedProduct?.isActive === false) throw new BadGatewayException('Sản phẩm đã ngưng kinh doanh!');
                if (!existedProduct) throw new BadGatewayException('Sản phẩm không tồn tại!');

                const existedProductVariant = await this.modelProductVariant.findByPk(productVariantId, { transaction });
                if (existedProductVariant?.isActive === false) throw new BadGatewayException('Biến thể đã ngưng kinh doanh!');
                if (existedProductVariant && Number(existedProductVariant.productId) !== Number(productId)) {
                    throw new BadRequestException(
                        `Biến thể ${productVariantId} không thuộc sản phẩm ${productId}! (DB: ${existedProductVariant.productId})`
                    );
                }
                if (!existedProductVariant) throw new BadGatewayException('Biến thể không tồn tại!');
            }

            // ==========================================
            // 2. LẤY GIỎ HÀNG
            // ==========================================
            const cart = await this.cartService.getCartByContext(sessionId, userId, transaction);
            let matchingCartItem: CartItems | null;

            // ==========================================
            // 3. TÌM KIẾM TRÙNG LẶP
            // ==========================================
            if (isCombo) {
                // 🔥 Dùng finalComboOptions để so sánh
                matchingCartItem = await this.matchingComboCartItem(
                    cart.id,
                    comboId,
                    finalComboOptions
                );
            } else {
                const options = singleProductOptions || [];
                matchingCartItem = await this.matchingRegularCartItem(
                    cart.id,
                    productId!,
                    productVariantId!,
                    options,
                    transaction
                );
            }

            // ==========================================
            // 4. XỬ LÝ KẾT QUẢ
            // ==========================================
            if (matchingCartItem) {
                // === TRƯỜNG HỢP A: ĐÃ CÓ -> TĂNG SỐ LƯỢNG ===
                await matchingCartItem.increment('quantity', {
                    by: quantity,
                    transaction
                });

                // (Giữ nguyên logic update ingredient cho món lẻ)
                if (!isCombo && singleProductOptions && singleProductOptions.length > 0) {
                    for (const opt of singleProductOptions) {
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
                    include: [{
                        model: this.modelCartItemIngredient,
                        attributes: ['ingredientId', 'quantity', 'type']
                    }],
                    transaction
                });

                await transaction.commit();
                return {
                    message: 'Đã tăng số lượng thành công!',
                    data: matchingCartItem
                };
            }
            else {
                // === TRƯỜNG HỢP B: CHƯA CÓ -> TẠO MỚI ===

                const newCartItem = await this.modelCartItems.create({
                    cartId: cart.id,
                    productId: isCombo ? null : productId,
                    productVariantId: isCombo ? null : productVariantId,
                    comboId: isCombo ? comboId : null,

                    selectedOptions: null,

                    quantity: quantity,
                } as any, { transaction });

                // (Giữ nguyên logic create ingredient cho món lẻ)
                if (!isCombo && singleProductOptions && singleProductOptions.length > 0) {
                    const ingredientsToCreate: any[] = singleProductOptions.map(opt => ({
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
                    include: [{
                        model: this.modelCartItemIngredient,
                        attributes: ['ingredientId', 'quantity', 'type']
                    }],
                    transaction
                });

                await transaction.commit()
                return {
                    message: 'Thêm vào giỏ hàng thành công!',
                    data: newCartItem
                };
            }

        } catch (error) {
            console.error(error);
            await transaction.rollback();
            throw error;
        }
    }
    /**
     * Tìm cart item món lẻ khớp chính xác
     */
    async matchingRegularCartItem(
        cartId: number,
        productId: number,
        productVariantId: number,
        ingredients: any[], // DTO gửi lên (cấu hình cho 1 sản phẩm)
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

        // Payload gửi lên là cấu hình cho 1 sản phẩm (VD: 2 Cheese)
        const normalizedPayload = this.normalizeIngredients(ingredients);
        const payloadSignature = JSON.stringify(normalizedPayload);

        for (const item of candidates) {
            const currentItemQty = item.dataValues.quantity; // VD: Đang có 2 cái Pizza
            const cartItemIngredients = item.dataValues.cartItemIngredients || [];

            // 🔥 QUAN TRỌNG: Chuẩn hóa dữ liệu DB về "trên 1 sản phẩm"
            const dbIngredients = cartItemIngredients.map(ing => {
                // Logic bảo vệ: Nếu chia ra lẻ hoặc số lượng item = 0 (lỗi data) thì lấy luôn số gốc
                // VD: DB lưu 4 Cheese, Item Qty = 2 => Unit Qty = 2
                const unitQty = currentItemQty > 0
                    ? (ing.dataValues.quantity / currentItemQty)
                    : ing.dataValues.quantity;

                return {
                    ingredientId: ing.dataValues.ingredientId,
                    quantity: unitQty, // So sánh dựa trên số lượng của 1 đơn vị
                    type: ing.dataValues.type
                };
            });

            const normalizedDbData = this.normalizeIngredients(dbIngredients);
            const dbSignature = JSON.stringify(normalizedDbData);

            if (payloadSignature === dbSignature) {
                return item;
            }
        }

        return null;
    }


    private normalizeIngredients(ingredients: any[]): any[] {
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) return [];

        return ingredients
            .map(ing => ({
                ingredientId: Number(ing.ingredientId), // Ép kiểu Number
                quantity: Number(ing.quantity),         // Ép kiểu Number
                type: String(ing.type)                  // Ép kiểu String
            }))
            .sort((a, b) => {
                // Sắp xếp theo ID -> Nếu ID bằng nhau thì sắp xếp theo Type (ADD trước REMOVE sau)
                if (a.ingredientId !== b.ingredientId) return a.ingredientId - b.ingredientId;
                return a.type.localeCompare(b.type);
            });
    }
    /**
     * Tìm combo cart item khớp chính xác
     */
    async matchingComboCartItem(
        cartId: number,
        comboId: number,
        selectedOptions: NormalizedComboCartOption[]
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

        const normalizedPayload = this.normalizeComboOptions(selectedOptions);
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
 * Normalize combo options để so sánh (deep sort)
 */
    private normalizeComboOptions(options: any[]): any[] {
        if (!options || !Array.isArray(options) || options.length === 0) return [];

        // 1. Deep copy để tránh mutate dữ liệu gốc
        const clonedOptions = JSON.parse(JSON.stringify(options));

        return clonedOptions
            .map(opt => {
                // Chuẩn hóa Ingredients: Luôn trả về mảng (empty nếu không có)
                const rawIngredients = Array.isArray(opt.ingredients) ? opt.ingredients : [];

                const normalizedIngredients = rawIngredients
                    .filter(ing => ing && ing.ingredientId) // Lọc rác
                    .map(ing => ({
                        ingredientId: Number(ing.ingredientId), // Ép kiểu Number cho chắc
                        quantity: Number(ing.quantity),
                        type: String(ing.type) // Ép kiểu String
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
                    ingredients: normalizedIngredients // Luôn luôn có key ingredients
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
                throw new BadRequestException(`Biáº¿n thá»ƒ ${variantId} khÃ´ng tá»“n táº¡i!`);
            }
            if (variant.isActive === false) {
                throw new BadRequestException(`Biáº¿n thá»ƒ ${variantId} Ä‘Ã£ ngÆ°ng kinh doanh!`);
            }
            if (false) {
                throw new BadRequestException(`Biáº¿n thá»ƒ ${variantId} khÃ´ng há»£p lá»‡ Ä‘á»ƒ dÃ¹ng trong combo!`);
            }

            const canonicalProductId = Number(variant.productId);
            const requestedProductId = Number(option.productId);
            const product = productMap.get(canonicalProductId);
            if (!product) {
                throw new BadRequestException(`Sáº£n pháº©m ${canonicalProductId} khÃ´ng tá»“n táº¡i!`);
            }
            if (product.isActive === false) {
                throw new BadRequestException(`Sáº£n pháº©m ${canonicalProductId} Ä‘Ã£ ngÆ°ng kinh doanh!`);
            }

            const seenIngredientIds = new Set<number>();
            const normalizedIngredients = (option.ingredients || []).map(ingredient => {
                const ingredientId = Number(ingredient.ingredientId);
                const quantity = Number(ingredient.quantity);
                const type = String(ingredient.type) as 'ADD' | 'REMOVE';

                if (seenIngredientIds.has(ingredientId)) {
                    throw new BadRequestException(`Duplicate ingredient ${ingredientId} trong má»™t mÃ³n!`);
                }
                seenIngredientIds.add(ingredientId);

                if (!ingredientMap.has(ingredientId)) {
                    throw new BadRequestException(`Ingredient ${ingredientId} khÃ´ng tá»“n táº¡i!`);
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

            const slot = this.resolveComboSlot(comboSlots, option, variant, index, usedSlotKeys, requestedProductId);
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

    private resolveComboSlot(
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
                throw new BadRequestException(`Combo item ${comboItemId} slot ${slotIndex} không hợp lệ!`);
            }

            const key = this.comboSlotKey(explicitSlot.comboItemId, explicitSlot.slotIndex);
            if (usedSlotKeys.has(key)) {
                throw new BadRequestException(`Combo item ${comboItemId} slot ${slotIndex} bị trùng!`);
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

        throw new BadRequestException('Cấu hình combo không hợp lệ!');
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
     * Validate các món trong combo có tồn tại không
     */
    private async validateComboOptions(
        options: ComboOptionDto[],
        transaction: any
    ): Promise<void> {
        if (!options || options.length === 0) return;

        // 1. Gom tất cả ID
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
                // Không cần attributes, lấy all để check productId
                transaction
            }),
            allIngredientIds.length > 0
                ? this.modelIngredient.findAll({ where: { id: allIngredientIds }, transaction })
                : []
        ]);

        // 3. Convert sang Set/Map (Ép kiểu Number cho Key để an toàn)
        const productMap = new Set(products.map(p => Number(p.id)));
        // Map: Key = VariantID, Value = Variant Instance
        const variantMap = new Map(variants.map(v => [Number(v.id), v]));
        const ingredientMap = new Set(ingredients.map(i => Number(i.id)));

        // 4. Validate Logic
        for (const option of options) {
            // Ép kiểu input về Number
            const optProductId = Number(option.productId);
            const optVariantId = Number(option.productVariantId);

            // Check Product
            if (!productMap.has(optProductId)) {
                throw new BadRequestException(`Sản phẩm ${optProductId} không tồn tại!`);
            }

            // Check Variant
            const variant = variantMap.get(optVariantId);
            if (!variant) {
                throw new BadRequestException(`Biến thể ${optVariantId} không tồn tại!`);
            }

            // 🔥 FIX QUAN TRỌNG: Ép kiểu khi so sánh productId
            if (Number(variant.productId) !== optProductId) {
                throw new BadRequestException(
                    `Biến thể ${optVariantId} không thuộc sản phẩm ${optProductId}! (DB: ${variant.productId})`
                );
            }

            // Check Ingredients
            if (option.ingredients && option.ingredients.length > 0) {
                const tempIngIds = new Set();
                for (const ing of option.ingredients) {
                    const ingId = Number(ing.ingredientId);
                    const ingQty = Number(ing.quantity);

                    if (tempIngIds.has(ingId)) {
                        throw new BadRequestException(`Duplicate ingredient ${ingId} trong một món!`);
                    }
                    tempIngIds.add(ingId);

                    if (!ingredientMap.has(ingId)) {
                        throw new BadRequestException(`Ingredient ${ingId} không tồn tại!`);
                    }

                    if (!['ADD', 'REMOVE'].includes(ing.type)) {
                        throw new BadRequestException(`Type ingredient không hợp lệ!`);
                    }
                    if (ingQty <= 0) {
                        throw new BadRequestException(`Số lượng ingredient phải lớn hơn 0!`);
                    }
                }
            }
        }
    }

    /**
      * 🔥 HÀM MỚI: Sinh options mặc định từ cấu hình ComboItem trong DB
      */
    private async generateDefaultComboOptions(
        comboId: number,
        transaction: any
    ): Promise<any[]> {
        // 1. Lấy cấu hình các món trong combo
        const comboItems = await this.modelComboItem.findAll({
            where: { comboId },
            transaction
        });

        if (!comboItems || comboItems.length === 0) {
            throw new BadGatewayException('Combo này chưa được cấu hình món ăn (Empty ComboItem)!');
        }

        const generatedOptions: any[] = [];

        // 2. Map sang cấu trúc JSON
        for (const item of comboItems) {
            // Quan trọng: Nếu quantity = 2 (VD: 2 lon Coca), ta phải tách thành 2 object riêng biệt
            // để sau này khách có thể đổi 1 lon Coca thành Sprite, lon kia giữ nguyên.
            const qty = item.quantity || 1;

            for (let i = 0; i < qty; i++) {
                generatedOptions.push({
                    productId: item.productId,
                    productVariantId: item.productVariantId, // Variant mặc định (VD: Size M)
                    ingredients: [] // Mặc định không có topping thêm
                });
            }
        }

        // 3. Sắp xếp để đảm bảo tính nhất quán khi so sánh chuỗi (Matching)
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
                throw new BadGatewayException('Giỏ hàng khóa chưa được tìm thấy!')
            }

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
                        await item.increment('quantity', {
                            by: 1,
                            transaction
                        })
                    }))
                }
                await cartItem.reload({ transaction });

                await transaction.commit()

                return {
                    message: 'Đã tăng số lượng thành công',
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
                        message: 'Đã xóa sản phẩm thành công'
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
                        await item.decrement('quantity', {
                            by: 1,
                            transaction
                        })
                    }))
                }
                await cartItem.reload({ transaction });

                await transaction.commit()

                return {
                    message: 'Đã tăng số lượng thành công',
                    data: cartItem
                }
            }
        } catch (error) {
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
                throw new NotFoundException('Cart item không tồn tại!')
            }

            const cart = await this.modelCarts.findByPk(cartItem.cartId, { transaction })

            if (!cart) {
                throw new NotFoundException('Cart không tồn tại!')
            }

            const isOwner = (userId && cart.userId === userId) ||
                (sessionId && cart.sessionId === sessionId)

            if (!isOwner) {
                throw new ForbiddenException('Bạn không có quyền xóa cart item này!')
            }

            await cartItem.destroy({
                transaction
            })
            await transaction.commit()

            return {
                message: 'Đã xóa sản phẩm trong giỏ hàng'
            }
        } catch (error) {
            console.log(error);
            await transaction.rollback()
            throw error
        }
    }


    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Tìm cart item khớp chính xác với product + variant + ingredients
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
     * Tìm cart item có cùng productId + productVariantId nhưng KHÔNG có ingredients
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
        // 1. Dùng transaction để đảm bảo an toàn
        const transaction = await this.sequelize.transaction();

        try {
            // ---------------------------------------------------------
            // BƯỚC 1: LẤY GUEST CART (KÈM FULL THÔNG TIN)
            // ---------------------------------------------------------
            // QUAN TRỌNG: Phải include cả CartItemsIngredient để check món lẻ
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

            // Nếu không có giỏ guest -> Không làm gì cả, return luôn (Đừng throw lỗi)
            // Vì user mới login có thể chưa từng thêm gì vào giỏ
            if (!guestCart) {
                await transaction.commit();
                return { message: 'Không có giỏ hàng khách để merge.' };
            }

            const userCart = await this.cartService.getOrCreateUserCart(userId, transaction);
            const userCartId = userCart.dataValues.id;

            // ---------------------------------------------------------
            // BƯỚC 2: DUYỆT TỪNG MÓN BÊN GUEST ĐỂ XỬ LÝ
            // ---------------------------------------------------------
            for (const guestItem of guestCart.dataValues.cartItems) {
                let matchingUserItem: CartItems | null = null;

                // --- TRƯỜNG HỢP A: COMBO ---
                if (guestItem.comboId) {
                    // Gọi lại hàm check trùng Combo mình đã viết ở CartItemService
                    // (Giả sử bạn đang ở trong CartService, cần inject CartItemService hoặc copy logic đó sang)
                    matchingUserItem = await this.matchingComboCartItem(
                        userCartId,
                        guestItem.comboId,
                        this.normalizeDbComboOptions(guestItem.comboOptions || [])
                    );
                }
                // --- TRƯỜNG HỢP B: MÓN LẺ ---
                else if (guestItem.productId) {
                    const guestIngredientIds = guestItem.cartItemIngredients.map(i => i.ingredientId);

                    // Gọi lại hàm check trùng Món Lẻ
                    matchingUserItem = await this.matchingRegularCartItem(
                        userCartId,
                        guestItem.productId,
                        guestItem.productVariantId,
                        guestIngredientIds,
                        transaction
                    );
                }

                // ---------------------------------------------------------
                // BƯỚC 3: QUYẾT ĐỊNH MERGE HAY MOVE
                // ---------------------------------------------------------

                if (matchingUserItem) {
                    // === TÌNH HUỐNG 1: ĐÃ CÓ TRÙNG KHỚP (MERGE) ===

                    // 1. Cộng dồn số lượng vào item của User
                    await matchingUserItem.increment('quantity', {
                        by: guestItem.quantity,
                        transaction
                    });

                    // 2. Nếu là món lẻ, phải cộng dồn cả số lượng Topping trong bảng phụ
                    if (!guestItem.comboId && guestItem.cartItemIngredients?.length > 0) {
                        // Logic: Tìm các dòng ingredient tương ứng của UserItem và cộng thêm
                        // (Để đơn giản, ta giả định ingredient giống hệt nhau thì bulk update hoặc loop update)
                        for (const guestIng of guestItem.cartItemIngredients) {
                            await this.modelCartItemIngredient.increment(
                                { quantity: guestIng.quantity }, // Cộng thêm số lượng từ guest
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

                    // 3. Xóa item bên Guest (vì đã cộng dồn sang User rồi)
                    await guestItem.destroy({ transaction });

                } else {
                    // === TÌNH HUỐNG 2: CHƯA CÓ (MOVE) ===
                    // Đây là cách tối ưu nhất: Chỉ cần đổi chủ sở hữu (cartId)

                    await guestItem.update(
                        { cartId: userCartId },
                        { transaction }
                    );

                    // Lưu ý: Các bảng phụ (CartItemsIngredient) sẽ tự động đi theo
                    // vì chúng liên kết với CartItemId, mà ID này không đổi, chỉ đổi cartId cha.
                }
            }

            // ---------------------------------------------------------
            // BƯỚC 4: DỌN DẸP
            // ---------------------------------------------------------
            // Xóa vỏ giỏ hàng Guest (Item bên trong đã bị xóa hoặc di chuyển hết rồi)
            await this.modelCarts.destroy({
                where: { id: guestCart.id },
                transaction
            });

            await transaction.commit();
            return {
                message: 'Đồng bộ giỏ hàng thành công!',
            };

        } catch (error) {
            console.log(error);
            await transaction.rollback();
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
            message: 'Lấy cartItem thanh cong',
            data: summary
        }
    }

    // cart-item.service.ts

    async updateCartItem(
        cartItemId: number,
        updateData: UpdateCartItemDto,
        userId?: number | null,
        sessionId?: string
    ): Promise<{ message: string; data: CartItems }> {
        const transaction = await this.sequelize.transaction();

        try {
            // 1. TÌM CART ITEM
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
                throw new NotFoundException('Cart item không tồn tại!');
            }

            // 2. KIỂM TRA QUYỀN SỞ HỮU
            const cart = cartItem.cart;
            const isOwner = (userId && cart.userId === userId) ||
                (sessionId && cart.sessionId === sessionId);

            if (!isOwner) {
                throw new ForbiddenException('Bạn không có quyền chỉnh sửa cart item này!');
            }

            const isCombo = !!cartItem.comboId;

            // 3. UPDATE QUANTITY (nếu có)
            if (updateData.quantity !== undefined) {
                if (updateData.quantity <= 0) {
                    throw new BadRequestException('Số lượng phải lớn hơn 0!');
                }
                cartItem.quantity = updateData.quantity;
            }

            // 4. UPDATE COMBO
            if (isCombo && updateData.selectedOptions !== undefined) {
                const hasExplicitComboSlots = updateData.selectedOptions.some(option => Number(option.comboItemId || 0) > 0);
                const normalizedOptions = hasExplicitComboSlots
                    ? await this.normalizeComboOptionsForCart(
                        Number(cartItem.comboId),
                        updateData.selectedOptions,
                        transaction
                    )
                    : [];

                await this.clearComboOptionsForCartItem(cartItem.id, transaction);
                if (normalizedOptions.length > 0) {
                    await this.createComboOptionsForCartItem(cartItem.id, normalizedOptions, transaction);
                }
                cartItem.selectedOptions = null;
            }

            // 5. UPDATE SINGLE PRODUCT
            // 5. UPDATE SINGLE PRODUCT
            if (!isCombo) {
                // Update variant (nếu có)
                if (updateData.productVariantId) {
                    const variant = await this.productVariantService.findById(updateData.productVariantId);
                    if (!variant) {
                        throw new BadRequestException('Variant không tồn tại!');
                    }

                    // Kiểm tra variant có thuộc product này không
                    if (variant.productId !== cartItem.productId) {
                        throw new BadRequestException('Variant không thuộc product này!');
                    }

                    cartItem.productVariantId = updateData.productVariantId;
                }

                // Update ingredients (nếu có)
                if (updateData.singleProductOptions) {
                    // Xóa ingredients cũ
                    await this.modelCartItemIngredient.destroy({
                        where: { cartItemId: cartItem.id },
                        transaction
                    });

                    // Thêm ingredients mới
                    if (updateData.singleProductOptions.length > 0) {
                        // ✅ Cast sang plain object cho bulkCreate
                        const ingredientsToCreate = updateData.singleProductOptions.map(opt => ({
                            cartItemId: cartItem.id,
                            ingredientId: opt.ingredientId,
                            quantity: cartItem.quantity * opt.quantity,
                            type: opt.type as 'ADD' | 'REMOVE' // ✅ Cast type
                        }));

                        await this.modelCartItemIngredient.bulkCreate(
                            ingredientsToCreate as any, // ✅ Cast as any để bypass Sequelize typing
                            { transaction }
                        );
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
                    }
                ],
                transaction
            });

            await transaction.commit();

            return {
                message: 'Cập nhật cart item thành công!',
                data: cartItem
            };

        } catch (error) {
            console.error('❌ Update cart item error:', error);
            await transaction.rollback();
            throw error;
        }
    }


}
