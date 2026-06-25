import { Helper } from '@/utils/helper';
import { CartCheckoutOutput, CartPreviewItem, CartPreviewOutput } from './types/cart-prev.type';
import {
    Address,
    CartItemComboOption,
    CartItemComboOptionIngredient,
    CartItems,
    CartItemsIngredient,
    Combo,
    ComboItem,
    Ingredient,
    Product,
    ProductVariant
} from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CheckoutCaculateDto } from './dto/checkout.dto';
import { AddressService } from '../address/address.service';
import { CouponService } from '../coupon/coupon.service';

@Injectable()
export class CartPreviewService {
    constructor(
        @InjectModel(CartItems) private cartItemsModel: typeof CartItems,
        @InjectModel(CartItemsIngredient) private cartItemsIngredientModel: typeof CartItemsIngredient,
        @InjectModel(ProductVariant) private productVariantModel: typeof ProductVariant,
        @InjectModel(Ingredient) private ingredientModel: typeof Ingredient,
        @InjectModel(Address) private addressModel: typeof Address,
        @InjectModel(Product) private productModel: typeof Product,
        @InjectModel(Combo) private comboModel: typeof Combo,
        @InjectModel(ComboItem) private comboItemModel: typeof ComboItem,
        @InjectModel(CartItemComboOption) private cartItemComboOptionModel: typeof CartItemComboOption,
        @InjectModel(CartItemComboOptionIngredient) private cartItemComboOptionIngredientModel: typeof CartItemComboOptionIngredient,
        private readonly addressService: AddressService,
        private readonly couponService: CouponService,
        private readonly sequelize: Sequelize
    ) { }

    async getUserCartPreview(cartId: number, cartItemIds?: number[]): Promise<CartPreviewOutput> {
        const cartItems = await this.cartItemsModel.findAll({
            where: {
                cartId,
                ...(cartItemIds && cartItemIds.length > 0 ? { id: { [Op.in]: cartItemIds } } : {})
            },
            include: [
                { model: this.productModel, attributes: ['id', 'name', 'basePrice', 'imageUrl', 'isActive'], required: false },
                { model: this.productVariantModel, attributes: ['id', 'name', 'size', 'type', 'modifiedPrice', 'productId', 'isActive'], required: false },
                { model: this.comboModel, attributes: ['id', 'name', 'price', 'imageUrl', 'discountPercentage', 'isActive'], required: false },
                {
                    model: this.cartItemsIngredientModel,
                    required: false,
                    include: [{ model: this.ingredientModel, attributes: ['id', 'name', 'price'] }]
                },
                {
                    model: this.cartItemComboOptionModel,
                    required: false,
                    include: [{
                        model: this.cartItemComboOptionIngredientModel,
                        required: false,
                        include: [{ model: this.ingredientModel, attributes: ['id', 'name', 'price'] }]
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        if (!cartItems || cartItems.length === 0) {
            return { message: 'Gio hang trong', data: { items: [], totalAmount: 0 } };
        }

        const comboIdsInCart = new Set<number>();
        const selectedProductIds = new Set<number>();
        const selectedVariantIds = new Set<number>();

        cartItems.forEach(item => {
            if (item.dataValues.comboId) comboIdsInCart.add(Number(item.dataValues.comboId));
            (item.dataValues.comboOptions || []).forEach(option => {
                selectedProductIds.add(Number(option.dataValues.selectedProductId));
                selectedVariantIds.add(Number(option.dataValues.selectedProductVariantId));
            });
        });

        const defaultComboItems = await this.comboItemModel.findAll({
            where: { comboId: { [Op.in]: Array.from(comboIdsInCart) } },
            include: [
                { model: this.productModel, attributes: ['id', 'name', 'basePrice', 'imageUrl', 'isActive'] },
                { model: this.productVariantModel, attributes: ['id', 'name', 'size', 'type', 'modifiedPrice', 'productId', 'isActive'] }
            ],
            order: [['id', 'ASC']]
        });

        const comboDefaultsMap = new Map<number, { comboItem: ComboItem; slotIndex: number }[]>();
        defaultComboItems.forEach(comboItem => {
            const comboId = Number(comboItem.comboId);
            if (!comboDefaultsMap.has(comboId)) comboDefaultsMap.set(comboId, []);

            const qty = Number(comboItem.quantity || 1);
            for (let slotIndex = 0; slotIndex < qty; slotIndex++) {
                comboDefaultsMap.get(comboId)?.push({ comboItem, slotIndex });
            }
        });

        const [selectedProducts, selectedVariants] = await Promise.all([
            selectedProductIds.size > 0
                ? this.productModel.findAll({
                    where: { id: { [Op.in]: Array.from(selectedProductIds) } },
                    attributes: ['id', 'name', 'basePrice', 'imageUrl', 'isActive']
                })
                : [],
            selectedVariantIds.size > 0
                ? this.productVariantModel.findAll({
                    where: { id: { [Op.in]: Array.from(selectedVariantIds) } },
                    attributes: ['id', 'name', 'size', 'type', 'modifiedPrice', 'productId', 'isActive']
                })
                : []
        ]);

        const selectedProductMap = new Map<number, Product>(selectedProducts.map(product => [Number(product.id), product] as [number, Product]));
        const selectedVariantMap = new Map<number, ProductVariant>(selectedVariants.map(variant => [Number(variant.id), variant] as [number, ProductVariant]));
        let subtotal = 0;
        const previewItems: CartPreviewItem[] = [];

        for (const item of cartItems) {
            const finalItemObj = item.dataValues.comboId
                ? this.buildComboPreviewItem(
                    item,
                    comboDefaultsMap,
                    selectedProductMap,
                    selectedVariantMap
                )
                : this.buildSinglePreviewItem(item);

            if (!finalItemObj) continue;

            subtotal += finalItemObj.totalPrice;
            previewItems.push(finalItemObj);
        }

        return {
            message: 'Lay thong tin gio hang thanh cong.',
            data: {
                items: previewItems,
                totalAmount: subtotal
            }
        };
    }

    async cartPreview(cartId: number, cartItemIds: number[]): Promise<CartPreviewOutput> {
        return this.getUserCartPreview(cartId, cartItemIds);
    }

    async checkoutCaculate(userId: number, cartId: number, dto: CheckoutCaculateDto): Promise<CartCheckoutOutput> {
        const cartPrev = await this.cartPreview(cartId, dto.cartItemId);

        if (!cartPrev) {
            throw new BadRequestException('No valid cart items found for preview.');
        }

        let deliveryFee = 0;

        if (dto.temporaryAddress) {
            const distanceResult = await this.addressService.caculateDistance(dto.temporaryAddress.latitude, dto.temporaryAddress.longitude);
            deliveryFee = Helper.caculateDeliveryFee(distanceResult.distance);
        } else if (dto.addressId) {
            const address = await this.addressModel.findByPk(dto.addressId);
            if (!address) {
                throw new BadRequestException('No valid address found for checkout.');
            }

            const distanceResult = await this.addressService.caculateDistance(address.dataValues.latitude, address.dataValues.longitude);
            deliveryFee = Helper.caculateDeliveryFee(distanceResult.distance);
        }

        let discount = 0;
        let appliedCoupon: any;
        if (dto.couponCode) {
            const validateCoupon = await this.couponService.validateCoupon(userId, dto.couponCode, cartPrev.data.totalAmount);
            discount = validateCoupon.discount;
            appliedCoupon = validateCoupon.couponInfo;
        }

        const subtotal = cartPrev.data.totalAmount;
        const finalTotal = subtotal + deliveryFee - discount;

        return {
            message: 'Cart checkout generated successfully.',
            data: {
                items: cartPrev.data.items || [],
                subtotal,
                deliveryFee,
                discount,
                finalTotal,
                appliedCoupon: appliedCoupon
                    ? {
                        code: appliedCoupon.code,
                        type: appliedCoupon.type,
                        value: appliedCoupon.value
                    }
                    : undefined
            }
        };
    }

    private buildComboPreviewItem(
        item: CartItems,
        comboDefaultsMap: Map<number, { comboItem: ComboItem; slotIndex: number }[]>,
        selectedProductMap: Map<number, Product>,
        selectedVariantMap: Map<number, ProductVariant>
    ): CartPreviewItem | null {
        const comboInstance = item.dataValues.combo;
        if (!comboInstance || comboInstance.dataValues.isActive === false) return null;

        const comboData = comboInstance.dataValues;
        const defaultSlots = comboDefaultsMap.get(Number(comboData.id)) || [];
        const optionMap = new Map<string, CartItemComboOption>();

        (item.dataValues.comboOptions || []).forEach(option => {
            optionMap.set(`${option.dataValues.comboItemId}:${option.dataValues.slotIndex}`, option);
        });

        const discountPercent = Number(comboData.discountPercentage || 0);
        const comboBasePrice = Number(comboData.price || 0);
        const discountedComboBasePrice = Math.ceil((comboBasePrice * (1 - (discountPercent / 100))) / 1000) * 1000;
        let itemUnitPrice = discountedComboBasePrice;
        let surchargeTotal = 0;
        const comboDetailsDisplay: any[] = [];
        const enrichedOptions: any[] = [];

        for (const slot of defaultSlots) {
            const defaultItem = slot.comboItem;
            const defaultProduct = defaultItem.dataValues.product;
            const defaultVariant = defaultItem.dataValues.productVariant;
            if (!defaultProduct || !defaultVariant) continue;
            if (defaultProduct.dataValues.isActive === false || defaultVariant.dataValues.isActive === false) continue;

            const option = optionMap.get(`${defaultItem.id}:${slot.slotIndex}`);
            const selectedProduct = option
                ? selectedProductMap.get(Number(option.dataValues.selectedProductId))
                : defaultProduct;
            const selectedVariant = option
                ? selectedVariantMap.get(Number(option.dataValues.selectedProductVariantId))
                : defaultVariant;

            if (!selectedProduct || !selectedVariant) continue;
            if (selectedProduct.dataValues.isActive === false || selectedVariant.dataValues.isActive === false) continue;

            const defaultPrice = Number(defaultProduct.dataValues.basePrice || 0) + Number(defaultVariant.dataValues.modifiedPrice || 0);
            const selectedPrice = Number(selectedProduct.dataValues.basePrice || 0) + Number(selectedVariant.dataValues.modifiedPrice || 0);
            let surcharge = option ? selectedPrice - defaultPrice : 0;
            const ingredientsDisplay: string[] = [];
            const enrichedIngredients: any[] = [];

            if (option) {
                for (const optionIngredient of option.dataValues.ingredients || []) {
                    const ingredientData = optionIngredient.dataValues.ingredient?.dataValues;
                    if (!ingredientData) continue;

                    enrichedIngredients.push({
                        ingredientId: ingredientData.id,
                        quantity: optionIngredient.dataValues.quantity,
                        type: optionIngredient.dataValues.type,
                        name: ingredientData.name,
                        price: ingredientData.price
                    });

                    if (optionIngredient.dataValues.type === 'ADD') {
                        const toppingTotal = Number(ingredientData.price || 0) * Number(optionIngredient.dataValues.quantity || 1);
                        surcharge += toppingTotal;
                        ingredientsDisplay.push(`+ ${ingredientData.name} (x${optionIngredient.dataValues.quantity})`);
                    } else {
                        ingredientsDisplay.push(`KHONG LAY ${ingredientData.name}`);
                    }
                }
            }

            itemUnitPrice += surcharge;
            surchargeTotal += surcharge;

            comboDetailsDisplay.push({
                productName: selectedProduct.dataValues.name,
                variantName: `${selectedVariant.dataValues.size} - ${selectedVariant.dataValues.type}`,
                ingredients: ingredientsDisplay,
                surcharge
            });

            enrichedOptions.push({
                comboItemId: Number(defaultItem.id),
                slotIndex: Number(slot.slotIndex),
                productId: Number(selectedProduct.dataValues.id),
                productVariantId: Number(selectedVariant.dataValues.id),
                ingredients: enrichedIngredients,
                product: {
                    id: selectedProduct.dataValues.id,
                    name: selectedProduct.dataValues.name,
                    imageUrl: selectedProduct.dataValues.imageUrl || '',
                    basePrice: selectedProduct.dataValues.basePrice
                },
                variant: {
                    id: selectedVariant.dataValues.id,
                    name: selectedVariant.dataValues.name,
                    size: selectedVariant.dataValues.size,
                    type: selectedVariant.dataValues.type,
                    modifiedPrice: selectedVariant.dataValues.modifiedPrice
                }
            });
        }

        return {
            cartItemId: item.dataValues.id,
            type: 'COMBO',
            name: comboData.name,
            imageUrl: comboData.imageUrl,
            unitPrice: itemUnitPrice,
            quantity: Number(item.dataValues.quantity || 1),
            totalPrice: itemUnitPrice * Number(item.dataValues.quantity || 1),
            rawData: {
                comboId: comboData.id,
                selectedOptions: enrichedOptions
            },
            details: {
                comboItems: comboDetailsDisplay,
                originalPrice: comboBasePrice + surchargeTotal,
                discountPercentage: discountPercent,
                savedAmount: comboBasePrice - discountedComboBasePrice
            }
        };
    }

    private buildSinglePreviewItem(item: CartItems): CartPreviewItem | null {
        const productData = item.dataValues.product;
        const variantData = item.dataValues.productVariant;
        const cartItemIngredients = item.dataValues.cartItemIngredients || [];
        const itemQty = Number(item.dataValues.quantity || 1);

        if (!productData || !variantData) return null;
        if (productData.dataValues.isActive === false || variantData.dataValues.isActive === false) return null;
        if (Number(variantData.dataValues.productId) !== Number(productData.dataValues.id)) return null;

        const basePrice = Number(productData.dataValues.basePrice || 0);
        const variantSurcharge = Number(variantData.dataValues.modifiedPrice || 0);
        const ingredientsDisplay: any[] = [];
        let toppingsCost = 0;

        for (const ing of cartItemIngredients) {
            const ingInstance = ing.dataValues.ingredient;
            if (!ingInstance) continue;

            const ingData = ingInstance.dataValues;
            const totalIngQty = Number(ing.dataValues.quantity || 0);
            const unitQty = itemQty > 0 ? (totalIngQty / itemQty) : 0;
            const price = Number(ingData.price || 0);

            if (ing.dataValues.type === 'ADD') {
                toppingsCost += price * unitQty;
                ingredientsDisplay.push({
                    ingredientId: ingData.id,
                    name: `+ ${ingData.name}`,
                    price,
                    quantity: unitQty,
                    totalPrice: price * unitQty,
                    type: 'ADD'
                });
            } else {
                ingredientsDisplay.push({
                    ingredientId: ingData.id,
                    name: `KHONG LAY ${ingData.name}`,
                    price: 0,
                    quantity: unitQty,
                    totalPrice: 0,
                    type: 'REMOVE'
                });
            }
        }

        const itemUnitPrice = basePrice + variantSurcharge + toppingsCost;

        return {
            cartItemId: item.dataValues.id,
            type: 'SINGLE',
            name: productData.dataValues.name,
            imageUrl: productData.dataValues.imageUrl,
            unitPrice: itemUnitPrice,
            quantity: itemQty,
            totalPrice: itemUnitPrice * itemQty,
            rawData: {
                productId: productData.dataValues.id,
                productVariantId: variantData.dataValues.id
            },
            details: {
                variantName: variantData.dataValues.name,
                size: variantData.dataValues.size,
                crust: variantData.dataValues.type,
                ingredients: ingredientsDisplay
            }
        };
    }
}
