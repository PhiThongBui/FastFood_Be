import { Helper } from '@/utils/helper';
import { CartCheckoutOutput, CartPreviewItem, CartPreviewOutput } from './types/cart-prev.type';
import { Address, CartItems, CartItemsIngredient, Combo, Ingredient, Product, ProductVariant } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreateAddressDto } from '../address/dto/addressStore.dto';
import { CheckoutCaculateDto } from './dto/checkout.dto';
import { AddressService } from '../address/address.service';
import { CouponService } from '../coupon/coupon.service';
import { log } from 'node:console';

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
        private readonly addressService: AddressService,
        private readonly couponService: CouponService,
        private readonly sequelize: Sequelize
    ) { }


    // async cartPreview(cartId: number, cartItemIds: number[], transaction: any): Promise<CartPreviewOutput> {
    //     // 1. Query CartItems
    //     const cartItems = await this.cartItemsModel.findAll({
    //         where: {
    //             id: { [Op.in]: cartItemIds },
    //             cartId: cartId
    //         },
    //         include: [
    //             {
    //                 model: this.productModel,
    //                 attributes: ['name', 'basePrice', 'imageUrl'],
    //                 required: false
    //             },
    //             {
    //                 model: this.productVariantModel,
    //                 attributes: ['id', 'name', 'size', 'type', 'modifiedPrice'],
    //                 required: false
    //             },
    //             {
    //                 model: this.comboModel,
    //                 attributes: ['id', 'name', 'price', 'imageUrl'],
    //                 required: false
    //             },
    //             {
    //                 model: this.cartItemsIngredientModel, // Include bảng phụ
    //                 required: false,
    //                 include: [{
    //                     model: this.ingredientModel,
    //                     attributes: ['id', 'name', 'price']
    //                 }]
    //             }
    //         ],
    //         transaction,
    //     });

    //     if (!cartItems || cartItems.length === 0) {
    //         throw new BadRequestException('Giỏ hàng trống hoặc không tìm thấy sản phẩm hợp lệ.');
    //     }

    //     // 2. CHUẨN BỊ DỮ LIỆU THAM CHIẾU (Pre-fetch cho Combo)
    //     const allIngredientIdsInCombos = new Set<number>();
    //     const allProductIdsInCombos = new Set<number>();
    //     const allVariantIdsInCombos = new Set<number>();

    //     cartItems.forEach(item => {
    //         const options = item.dataValues.selectedOptions;
    //         const comboId = item.dataValues.comboId;

    //         if (comboId && options) {
    //             options.forEach(opt => {
    //                 if (opt.productId) allProductIdsInCombos.add(opt.productId);
    //                 if (opt.productVariantId) allVariantIdsInCombos.add(opt.productVariantId);
    //                 if (opt.ingredients) {
    //                     opt.ingredients.forEach(ing => {
    //                         if (ing.ingredientId) allIngredientIdsInCombos.add(ing.ingredientId);
    //                     });
    //                 }
    //             });
    //         }
    //     })

    //     const [refIngredients, refProducts, refVariants] = await Promise.all([
    //         this.ingredientModel.findAll({
    //             where: { id: { [Op.in]: Array.from(allIngredientIdsInCombos) } },
    //             attributes: ['id', 'price', 'name'],
    //             transaction
    //         }),
    //         this.productModel.findAll({
    //             where: { id: { [Op.in]: Array.from(allProductIdsInCombos) } },
    //             attributes: ['id', 'name'],
    //             transaction
    //         }),
    //         this.productVariantModel.findAll({
    //             where: { id: { [Op.in]: Array.from(allVariantIdsInCombos) } },
    //             attributes: ['id', 'name', 'size', 'type'],
    //             transaction
    //         })
    //     ]);

    //     const ingredientMap = new Map(refIngredients.map(i => [i.dataValues.id, i]));
    //     const productMap = new Map(refProducts.map(p => [p.dataValues.id, p]));
    //     const variantMap = new Map(refVariants.map(v => [v.dataValues.id, v]));

    //     // 3. XỬ LÝ FORMAT VÀ TÍNH GIÁ
    //     let subtotal = 0;
    //     const previewItems: CartPreviewItem[] = [];

    //     for (const item of cartItems) {
    //         const isCombo = !!item.dataValues.comboId;
    //         const itemQty = item.dataValues.quantity; // Số lượng sản phẩm chính

    //         let itemUnitPrice = 0;
    //         let finalItemObj: CartPreviewItem;

    //         // ================= CASE A: COMBO (Giữ nguyên logic cũ) =================
    //         if (isCombo) {
    //             const comboData = item.dataValues.combo;
    //             if (!comboData) continue;

    //             let comboToppingPrice = 0;
    //             const comboDetailsDisplay: any[] = [];
    //             const options = item.dataValues.selectedOptions;

    //             if (options) {
    //                 for (const opt of options) {
    //                     const pInstance = productMap.get(opt.productId);
    //                     const pName = pInstance ? pInstance.dataValues.name : 'Sản phẩm ẩn';
    //                     const vInstance = variantMap.get(opt.productVariantId);
    //                     const vName = vInstance ? `${vInstance.dataValues.size} - ${vInstance.dataValues.type}` : 'Size mặc định';
    //                     const ingNames: string[] = [];

    //                     if (opt.ingredients) {
    //                         for (const ing of opt.ingredients) {
    //                             const ingInstance = ingredientMap.get(ing.ingredientId);
    //                             if (!ingInstance) continue;

    //                             if (ing.type === 'ADD') {
    //                                 comboToppingPrice += (ingInstance.dataValues.price * ing.quantity);
    //                                 ingNames.push(`+ ${ingInstance.dataValues.name} (x${ing.quantity})`);
    //                             } else if (ing.type === 'REMOVE') {
    //                                 ingNames.push(`KHÔNG LẤY ${ingInstance.dataValues.name}`);
    //                             }
    //                         }
    //                     }
    //                     comboDetailsDisplay.push({
    //                         productName: pName, variantName: vName, ingredients: ingNames
    //                     });
    //                 }
    //             }

    //             itemUnitPrice = comboData.dataValues.price + comboToppingPrice;

    //             finalItemObj = {
    //                 cartItemId: item.dataValues.id,
    //                 type: 'COMBO',
    //                 name: comboData.dataValues.name,
    //                 imageUrl: comboData.dataValues.imageUrl,
    //                 unitPrice: itemUnitPrice,
    //                 quantity: itemQty,
    //                 totalPrice: itemUnitPrice * itemQty,
    //                 details: { comboItems: comboDetailsDisplay }
    //             };
    //         }
    //         // ================= CASE B: MÓN LẺ (SINGLE) - CẬP NHẬT LOGIC =================
    //         else {
    //             const productData = item.dataValues.product;
    //             const variantData = item.dataValues.productVariant;
    //             const cartItemIngredients = item.dataValues.cartItemIngredients || [];

    //             if (!productData || !variantData) continue;

    //             // 1. Tính giá Topping cho 1 đơn vị sản phẩm
    //             const unitToppingPrice = cartItemIngredients.reduce((sum, ing) => {
    //                 // Chỉ tính tiền nếu là ADD
    //                 if (ing.dataValues.type === 'ADD') {
    //                     const totalIngQty = ing.dataValues.quantity; // Tổng số topping trong DB (VD: 4 cheese)
    //                     const ingPrice = ing.dataValues.ingredient?.dataValues.price || 0;

    //                     // Giá topping cho 1 bánh = (Tổng số topping / Số bánh) * Giá topping
    //                     // VD: (4 cheese / 2 bánh) * 10k = 20k tiền cheese/bánh
    //                     const unitQty = itemQty > 0 ? (totalIngQty / itemQty) : 0;

    //                     return sum + (ingPrice * unitQty);
    //                 }
    //                 return sum; // REMOVE giá = 0
    //             }, 0);

    //             const baseItemPrice = variantData.dataValues.modifiedPrice ?? productData.dataValues.basePrice;
    //             itemUnitPrice = baseItemPrice + unitToppingPrice;

    //             // 2. Format hiển thị chi tiết
    //             const ingredientsDisplay = cartItemIngredients.map(ing => {
    //                 const totalIngQty = ing.dataValues.quantity;
    //                 const unitQty = itemQty > 0 ? (totalIngQty / itemQty) : 0;
    //                 const ingName = ing.dataValues.ingredient?.dataValues.name;
    //                 const ingPrice = ing.dataValues.ingredient?.dataValues.price;
    //                 const type = ing.dataValues.type;

    //                 if (type === 'ADD') {
    //                     return {
    //                         name: `+ ${ingName}`, // Hiển thị dấu +
    //                         price: ingPrice,
    //                         quantity: unitQty,     // Hiển thị số lượng trên 1 bánh (x2)
    //                         totalPrice: ingPrice * unitQty
    //                     };
    //                 } else {
    //                     return {
    //                         name: `KHÔNG LẤY ${ingName}`, // Hiển thị chữ KHÔNG LẤY
    //                         price: 0,
    //                         quantity: unitQty,
    //                         totalPrice: 0
    //                     };
    //                 }
    //             });

    //             finalItemObj = {
    //                 cartItemId: item.dataValues.id,
    //                 type: 'SINGLE',
    //                 name: productData.dataValues.name,
    //                 imageUrl: productData.dataValues.imageUrl,
    //                 unitPrice: itemUnitPrice,
    //                 quantity: itemQty,
    //                 totalPrice: itemUnitPrice * itemQty,
    //                 details: {
    //                     variantName: variantData.dataValues.name,
    //                     size: variantData.dataValues.size,
    //                     crust: variantData.dataValues.type,
    //                     ingredients: ingredientsDisplay // Sử dụng list đã format
    //                 }
    //             };
    //         }

    //         subtotal += finalItemObj.totalPrice;
    //         previewItems.push(finalItemObj);
    //     }

    //     return {
    //         message: 'Lấy thông tin giỏ hàng thành công.',
    //         data: {
    //             items: previewItems,
    //             totalAmount: subtotal,
    //         },
    //     };
    // }

    async cartPreview(cartId: number, cartItemIds: number[], transaction: any): Promise<CartPreviewOutput> {
        // 1. Query CartItems (Giữ nguyên đoạn query của bạn)
        const cartItems = await this.cartItemsModel.findAll({
            where: { id: { [Op.in]: cartItemIds }, cartId: cartId },
            include: [
                { model: this.productModel, attributes: ['name', 'basePrice', 'imageUrl'], required: false },
                { model: this.productVariantModel, attributes: ['id', 'name', 'size', 'type', 'modifiedPrice'], required: false },
                { model: this.comboModel, attributes: ['id', 'name', 'price', 'imageUrl', 'discountPercentage'], required: false }, // Nhớ thêm discountPercentage vào attributes
                {
                    model: this.cartItemsIngredientModel,
                    required: false,
                    include: [{ model: this.ingredientModel, attributes: ['id', 'name', 'price'] }]
                }
            ],
            transaction,
        });

        if (!cartItems || cartItems.length === 0) {
            throw new BadRequestException('Giỏ hàng trống hoặc không tìm thấy sản phẩm hợp lệ.');
        }

        // 2. CHUẨN BỊ DỮ LIỆU THAM CHIẾU (Giữ nguyên đoạn Pre-fetch của bạn)
        const allIngredientIdsInCombos = new Set<number>();
        const allProductIdsInCombos = new Set<number>();
        const allVariantIdsInCombos = new Set<number>();

        cartItems.forEach(item => {
            const options = item.dataValues.selectedOptions;
            if (item.dataValues.comboId && options) {
                options.forEach(opt => {
                    if (opt.productId) allProductIdsInCombos.add(opt.productId);
                    if (opt.productVariantId) allVariantIdsInCombos.add(opt.productVariantId);
                    if (opt.ingredients) {
                        opt.ingredients.forEach(ing => {
                            if (ing.ingredientId) allIngredientIdsInCombos.add(ing.ingredientId);
                        });
                    }
                });
            }
        })

        const [refIngredients, refProducts, refVariants] = await Promise.all([
            this.ingredientModel.findAll({
                where: { id: { [Op.in]: Array.from(allIngredientIdsInCombos) } },
                attributes: ['id', 'price', 'name'],
                transaction
            }),
            this.productModel.findAll({
                where: { id: { [Op.in]: Array.from(allProductIdsInCombos) } },
                attributes: ['id', 'name', 'basePrice'], // Đảm bảo có basePrice
                transaction
            }),
            this.productVariantModel.findAll({
                where: { id: { [Op.in]: Array.from(allVariantIdsInCombos) } },
                attributes: ['id', 'name', 'size', 'type', 'modifiedPrice'],
                transaction
            })
        ]);

        const ingredientMap = new Map(refIngredients.map(i => [i.dataValues.id, i]));
        const productMap = new Map(refProducts.map(p => [p.dataValues.id, p]));
        const variantMap = new Map(refVariants.map(v => [v.dataValues.id, v]));

        // 3. XỬ LÝ FORMAT VÀ TÍNH GIÁ
        let subtotal = 0;
        const previewItems: CartPreviewItem[] = [];

        for (const item of cartItems) {
            const isCombo = !!item.dataValues.comboId;
            const itemQty = item.dataValues.quantity;

            let itemUnitPrice = 0;
            let finalItemObj: CartPreviewItem;

            // ================= CASE A: COMBO (Logic: Base + Variant + Topping) =================
            if (isCombo) {
                const comboInstance = item.dataValues.combo;
                if (!comboInstance) continue;

                const comboData = comboInstance.dataValues;
                let currentComboTotal = 0;
                const comboDetailsDisplay: any[] = [];
                const options = item.dataValues.selectedOptions;

                if (options) {
                    for (const opt of options) {
                        // Lấy data từ Map (đã có declare trong Model nên truy cập trực tiếp được)
                        const pInstance = productMap.get(opt.productId);
                        const vInstance = variantMap.get(opt.productVariantId);

                        if (!pInstance || !vInstance) continue;

                        // Lấy raw values
                        const pData = pInstance.dataValues;
                        const vData = vInstance.dataValues;

                        const pName = pData.name;
                        const vName = `${vData.size} - ${vData.type}`;
                        const ingNames: string[] = [];

                        // ---------------------------------------------------------
                        // 1. TÍNH GIÁ CƠ BẢN: BASE PRICE + VARIANT PRICE
                        // ---------------------------------------------------------

                        // Giá gốc sản phẩm
                        const basePrice = Number(pData.basePrice || 0);
                        console.log("basePrice", basePrice);

                        // Giá biến thể (Upsize/Đế...). Nếu null/undefined thì là 0.
                        const variantSurcharge = Number(vData.modifiedPrice || 0);
                        console.log("variantSurcharge", variantSurcharge);
                        
                        // 🔥 LOGIC SỬA: Cộng dồn Base + Variant
                        let componentPrice = basePrice + variantSurcharge;

                        // console.log(`Item: ${pName} | Base: ${basePrice} + Variant: ${variantSurcharge} = ${componentPrice}`);

                        // ---------------------------------------------------------
                        // 2. TÍNH GIÁ TOPPING (INGREDIENTS)
                        // ---------------------------------------------------------
                        if (opt.ingredients) {
                            for (const ing of opt.ingredients) {
                                const ingInstance = ingredientMap.get(ing.ingredientId);
                                if (!ingInstance) continue;

                                const ingData = ingInstance.dataValues;

                                if (ing.type === 'ADD') {
                                    const price = Number(ingData.price || 0);
                                    const qty = Number(ing.quantity || 1);

                                    // Cộng tiền topping vào giá món
                                    componentPrice += (price * qty);

                                    ingNames.push(`+ ${ingData.name} (x${qty})`);
                                } else if (ing.type === 'REMOVE') {
                                    // Không trừ tiền, chỉ ghi chú
                                    ingNames.push(`KHÔNG LẤY ${ingData.name}`);
                                }
                            }
                        }

                        // Cộng dồn giá món này vào tổng giá trị Combo
                        currentComboTotal += componentPrice;

                        comboDetailsDisplay.push({
                            productName: pName,
                            variantName: vName,
                            ingredients: ingNames
                        });
                    }
                }

                // ======================================================
                // 3. ÁP DỤNG GIẢM GIÁ COMBO (Nếu có)
                // ======================================================

                // Lấy % giảm giá (VD: 10%)
                const discountPercent = Number(comboData.discountPercentage || 0);

                // Giá sau khi giảm
                const discountedPrice = currentComboTotal * (1 - (discountPercent / 100));

                // Làm tròn về hàng nghìn
                itemUnitPrice = Math.ceil(discountedPrice / 1000) * 1000;

                finalItemObj = {
                    cartItemId: item.dataValues.id,
                    type: 'COMBO',
                    name: comboData.name,
                    imageUrl: comboData.imageUrl,

                    unitPrice: itemUnitPrice,
                    quantity: itemQty,
                    totalPrice: itemUnitPrice * itemQty,

                    details: {
                        comboItems: comboDetailsDisplay,
                        originalPrice: currentComboTotal, // Giá thực tế chưa giảm
                        savedAmount: currentComboTotal - itemUnitPrice // Số tiền tiết kiệm được
                    }
                };
            }
            // ================= CASE B: SINGLE =================
            else {
                const productData = item.dataValues.product;
                const variantData = item.dataValues.productVariant;
                const cartItemIngredients = item.dataValues.cartItemIngredients || [];

                if (!productData || !variantData) continue;

                // 1. Tính giá Topping
                const unitToppingPrice = cartItemIngredients.reduce((sum, ing) => {
                    if (ing.dataValues.type === 'ADD') {
                        const totalIngQty = ing.dataValues.quantity;
                        // SỬA: Ép kiểu Number
                        const ingPrice = Number(ing.dataValues.ingredient?.dataValues.price || 0);
                        const unitQty = itemQty > 0 ? (totalIngQty / itemQty) : 0;
                        return sum + (ingPrice * unitQty);
                    }
                    return sum;
                }, 0);

                // 2. Base Price
                let baseItemPrice = Number(productData.dataValues.basePrice || 0);
                if (variantData.dataValues.modifiedPrice != null) {
                    baseItemPrice += Number(variantData.dataValues.modifiedPrice);
                }

                itemUnitPrice = baseItemPrice + unitToppingPrice;

                // 3. Format Display
                const ingredientsDisplay = cartItemIngredients.map(ing => {
                    const ingData = ing.dataValues.ingredient?.dataValues;
                    if (!ingData) return null;

                    const totalIngQty = ing.dataValues.quantity;
                    const unitQty = itemQty > 0 ? (totalIngQty / itemQty) : 0;
                    const price = Number(ingData.price || 0);

                    if (ing.dataValues.type === 'ADD') {
                        return {
                            name: `+ ${ingData.name}`,
                            price: price,
                            quantity: unitQty,
                            totalPrice: price * unitQty
                        };
                    } else {
                        return {
                            name: `KHÔNG LẤY ${ingData.name}`,
                            price: 0,
                            quantity: unitQty,
                            totalPrice: 0
                        };
                    }
                }).filter(Boolean);

                finalItemObj = {
                    cartItemId: item.dataValues.id,
                    type: 'SINGLE',
                    name: productData.dataValues.name,
                    imageUrl: productData.dataValues.imageUrl,
                    unitPrice: itemUnitPrice,
                    quantity: itemQty,
                    totalPrice: itemUnitPrice * itemQty,
                    details: {
                        variantName: variantData.dataValues.name,
                        size: variantData.dataValues.size,
                        crust: variantData.dataValues.type,
                    }
                };
            }

            subtotal += finalItemObj.totalPrice;
            previewItems.push(finalItemObj);
        }

        return {
            message: 'Lấy thông tin giỏ hàng thành công.',
            data: {
                items: previewItems,
                totalAmount: subtotal,
            },
        };
    }

    async checkoutCaculate(userId: number, cartId: number, dto: CheckoutCaculateDto, transaction: any): Promise<any> {
        const cartPrev = await this.cartPreview(cartId, dto.cartItemId, transaction)

        if (!cartPrev) {
            throw new BadRequestException('No valid cart items found for preview.');
        }
        console.log(cartPrev.data.items);
        let deliveryFee = 0

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
        let applyedCouponCode: any
        if (dto.couponCode) {
            const validateCoupon = await this.couponService.validateCoupon(userId, dto.couponCode, cartPrev.data.totalAmount, transaction);
            console.log(validateCoupon);

            discount = validateCoupon.discount
            applyedCouponCode = validateCoupon.couponInfo;
        }
        const subTotal = cartPrev.data.totalAmount
        const finalTotal = subTotal + deliveryFee - discount;
        return {
            message: 'Cart checkout generated successfully.',
            data: {
                items: cartPrev.data.items || [],
                subtotal: subTotal,
                deliveryFee: deliveryFee,
                discount: discount,
                finalTotal: finalTotal,
                appliedCoupon: {
                    code: applyedCouponCode.code,
                    type: applyedCouponCode.type,
                    value: applyedCouponCode.value
                },
            }
        }
    }
}
