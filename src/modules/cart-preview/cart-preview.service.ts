import { Helper } from '@/utils/helper';
import { CartCheckoutOutput, CartPreviewItem, CartPreviewOutput } from './types/cart-prev.type';
import { Address, CartItems, CartItemsIngredient, Combo, ComboItem, Ingredient, Product, ProductVariant } from '@/models';
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
        private readonly addressService: AddressService,
        private readonly couponService: CouponService,
        private readonly sequelize: Sequelize
    ) { }

    async getUserCartPreview(cartId: number): Promise<CartPreviewOutput> {
        // =================================================================
        // 1. QUERY CART ITEMS (Giữ nguyên)
        // =================================================================
        const cartItems = await this.cartItemsModel.findAll({
            where: { cartId: cartId },
            include: [
                { model: this.productModel, attributes: ['id', 'name', 'basePrice', 'imageUrl'], required: false },
                { model: this.productVariantModel, attributes: ['id', 'name', 'size', 'type', 'modifiedPrice'], required: false },
                { model: this.comboModel, attributes: ['id', 'name', 'price', 'imageUrl', 'discountPercentage'], required: false },
                {
                    model: this.cartItemsIngredientModel,
                    required: false,
                    include: [{ model: this.ingredientModel, attributes: ['id', 'name', 'price'] }]
                }
            ],
            order: [['createdAt', 'DESC']] // Sắp xếp để dễ nhìn
        });

        if (!cartItems || cartItems.length === 0) {
            return { message: 'Giỏ hàng trống', data: { items: [], totalAmount: 0 } };
        }

        // =================================================================
        // 2. PRE-FETCH DATA & CHUẨN BỊ DỮ LIỆU THAM CHIẾU
        // =================================================================

        // 2.1. Gom ID để query 1 lần (Batch Query)
        const allIngredientIdsInCombos = new Set<number>();
        const allProductIdsInCombos = new Set<number>();
        const allVariantIdsInCombos = new Set<number>();
        const comboIdsInCart = new Set<number>();

        cartItems.forEach(item => {
            if (item.dataValues.comboId) comboIdsInCart.add(item.dataValues.comboId);

            const options = item.dataValues.selectedOptions;
            if (options) {
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
        });

        // 2.2. 🔥 QUAN TRỌNG: Lấy cấu hình mặc định (Default Items) của Combo
        // Mục đích: Để biết Combo này "gốc" gồm những món gì, từ đó tính chênh lệch
        const defaultComboItems = await this.comboItemModel.findAll({
            where: { comboId: { [Op.in]: Array.from(comboIdsInCart) } },
            include: [
                { model: this.productModel, attributes: ['id', 'basePrice'] },
                { model: this.productVariantModel, attributes: ['id', 'modifiedPrice'] }
            ],
            order: [['id', 'ASC']] // Sắp xếp ID tăng dần để khớp thứ tự với selectedOptions khi generate
        });

        // Map cấu hình mặc định theo ComboID
        // Key: ComboID, Value: Array các món mặc định (đã bung ra theo số lượng)
        const comboDefaultsMap = new Map<number, any[]>();
        defaultComboItems.forEach(item => {
            const cId = item.comboId;
            if (!comboDefaultsMap.has(cId)) comboDefaultsMap.set(cId, []);

            // Nếu quantity = 2, push 2 lần để khớp với selectedOptions (vì selectedOptions lưu tách lẻ)
            const qty = item.quantity || 1;
            for (let i = 0; i < qty; i++) {
                comboDefaultsMap.get(cId)?.push(item);
            }
        });

        // 2.3. Query thông tin chi tiết Product, Variant, Ingredient
        const [refIngredients, refProducts, refVariants] = await Promise.all([
            this.ingredientModel.findAll({
                where: { id: { [Op.in]: Array.from(allIngredientIdsInCombos) } },
                attributes: ['id', 'price', 'name'],
            }),
            this.productModel.findAll({
                where: { id: { [Op.in]: Array.from(allProductIdsInCombos) } },
                attributes: ['id', 'name', 'basePrice', 'imageUrl'],
            }),
            this.productVariantModel.findAll({
                where: { id: { [Op.in]: Array.from(allVariantIdsInCombos) } },
                attributes: ['id', 'name', 'size', 'type', 'modifiedPrice'],
            })
        ]);

        // Tạo Map để tra cứu nhanh O(1)
        const ingredientMap = new Map(refIngredients.map(i => [i.dataValues.id, i]));
        const productMap = new Map(refProducts.map(p => [p.dataValues.id, p]));
        const variantMap = new Map(refVariants.map(v => [v.dataValues.id, v]));

        // =================================================================
        // 3. TÍNH TOÁN GIÁ TIỀN (CORE LOGIC)
        // =================================================================
        let subtotal = 0;
        const previewItems: CartPreviewItem[] = [];

        for (const item of cartItems) {
            const isCombo = !!item.dataValues.comboId;
            const itemQty = item.dataValues.quantity;
            let itemUnitPrice = 0;
            let finalItemObj: CartPreviewItem;

            // =====================================================================
            // CASE A: COMBO - TÍNH THEO CÔNG THỨC DELTA (CHÊNH LỆCH)
            // Giá = Giá Combo Gốc + (Giá Món Mới - Giá Món Mặc Định) + Topping
            // =====================================================================
            if (isCombo) {
                const comboInstance = item.dataValues.combo;
                if (!comboInstance) continue;

                const comboData = comboInstance.dataValues;
                const userOptions = item.dataValues.selectedOptions || [];

                // 1. Lấy danh sách món gốc để so sánh
                const defaultItems = comboDefaultsMap.get(comboData.id) || [];

                // 2. Bắt đầu tính từ giá Combo Gốc
                let currentComboTotal = Number(comboData.price || 0);

                const comboDetailsDisplay: any[] = [];
                const enrichedOptions: any[] = [];

                // Duyệt qua từng món khách chọn
                userOptions.forEach((userOpt, index) => {
                    const pInstance = productMap.get(userOpt.productId);
                    const vInstance = variantMap.get(userOpt.productVariantId);

                    if (!pInstance || !vInstance) return; // Skip nếu data lỗi

                    const pData = pInstance.dataValues;
                    const vData = vInstance.dataValues;
                    const ingNames: string[] = [];
                    const enrichedIngredients: any[] = [];

                    // --- BƯỚC A: TÍNH CHÊNH LỆCH GIÁ (DELTA) ---
                    let deltaPrice = 0;

                    // Lấy món mặc định tương ứng ở vị trí index
                    const defaultItem = defaultItems[index];
                    if (defaultItem) {
                        // Giá Món Khách Chọn
                        const userPrice = Number(pData.basePrice) + Number(vData.modifiedPrice);
                        // Giá Món Mặc Định
                        const defaultPrice = Number(defaultItem.dataValues.product.basePrice) + Number(defaultItem.dataValues.productVariant.modifiedPrice);

                        // Delta = Khách Chọn - Mặc Định
                        // VD: Chọn size M (15k), Mặc định size M (15k) -> Delta = 0 (Không tính thêm tiền)
                        // VD: Chọn size L (50k), Mặc định size M (15k) -> Delta = 35k (Cộng thêm 35k)
                        deltaPrice = userPrice - defaultPrice;
                    } else {
                        // Fallback: Nếu không tìm thấy món mặc định (lỗi data), tính full giá variant
                        deltaPrice = Number(vData.modifiedPrice);
                    }

                    // Cộng chênh lệch vào tổng tiền
                    currentComboTotal += deltaPrice;

                    // --- BƯỚC B: TÍNH TIỀN TOPPING (LUÔN CỘNG THÊM) ---
                    if (userOpt.ingredients) {
                        for (const ing of userOpt.ingredients) {
                            const ingInstance = ingredientMap.get(ing.ingredientId);
                            if (!ingInstance) continue;
                            const ingData = ingInstance.dataValues;

                            enrichedIngredients.push({
                                ingredientId: ing.ingredientId,
                                quantity: ing.quantity,
                                type: ing.type,
                                name: ingData.name,
                                price: ingData.price,
                            });

                            if (ing.type === 'ADD') {
                                const price = Number(ingData.price || 0);
                                const qty = Number(ing.quantity || 1);
                                const toppingTotal = price * qty;

                                currentComboTotal += toppingTotal;
                                deltaPrice += toppingTotal; // Cộng vào surcharge để hiển thị

                                ingNames.push(`+ ${ingData.name} (x${qty})`);
                            } else if (ing.type === 'REMOVE') {
                                ingNames.push(`KHÔNG LẤY ${ingData.name}`);
                            }
                        }
                    }

                    // --- BƯỚC C: FORMAT DATA HIỂN THỊ ---
                    comboDetailsDisplay.push({
                        productName: pData.name,
                        variantName: `${vData.size} - ${vData.type}`,
                        ingredients: ingNames,
                        surcharge: deltaPrice // Số tiền chênh lệch (bao gồm upsize + topping)
                    });

                    // Build lại object đầy đủ thông tin để trả về FE
                    enrichedOptions.push({
                        productId: userOpt.productId,
                        productVariantId: userOpt.productVariantId,
                        ingredients: enrichedIngredients,
                        product: {
                            id: pData.id,
                            name: pData.name,
                            imageUrl: pData.imageUrl || '',
                            basePrice: pData.basePrice,
                        },
                        variant: {
                            id: vData.id,
                            name: vData.name,
                            size: vData.size,
                            type: vData.type,
                            modifiedPrice: vData.modifiedPrice,
                        }
                    });
                });

                // --- BƯỚC D: ÁP DỤNG GIẢM GIÁ (DISCOUNT) ---
                const discountPercent = Number(comboData.discountPercentage || 0);
                const finalPriceAfterDiscount = currentComboTotal * (1 - (discountPercent / 100));

                // Làm tròn
                itemUnitPrice = Math.ceil(finalPriceAfterDiscount / 1000) * 1000;

                finalItemObj = {
                    cartItemId: item.dataValues.id,
                    type: 'COMBO',
                    name: comboData.name,
                    imageUrl: comboData.imageUrl,
                    unitPrice: itemUnitPrice,
                    quantity: itemQty,
                    totalPrice: itemUnitPrice * itemQty,
                    rawData: {
                        comboId: comboData.id,
                        selectedOptions: enrichedOptions,
                    },
                    details: {
                        comboItems: comboDetailsDisplay,
                        originalPrice: currentComboTotal, // Giá trước khi giảm %
                        discountPercentage: discountPercent,
                        savedAmount: (currentComboTotal - itemUnitPrice)
                    }
                };
            }
            // =====================================================================
            // CASE B: MÓN LẺ (SINGLE PRODUCT) - LOGIC CŨ
            // =====================================================================
            else {
                const productData = item.dataValues.product;
                const variantData = item.dataValues.productVariant;
                const cartItemIngredients = item.dataValues.cartItemIngredients || [];

                if (!productData || !variantData) continue;

                // 1. Giá Base + Variant
                const basePrice = Number(productData.dataValues.basePrice || 0);
                const variantSurcharge = Number(variantData.dataValues.modifiedPrice || 0);
                let singleProductPrice = basePrice + variantSurcharge;

                // 2. Giá Topping
                let toppingsCost = 0;
                const ingredientsDisplay: any[] = [];

                for (const ing of cartItemIngredients) {
                    const ingInstance = ing.dataValues.ingredient;
                    if (!ingInstance) continue;
                    const ingData = ingInstance.dataValues;
                    const totalIngQty = Number(ing.dataValues.quantity || 0);
                    const unitQty = itemQty > 0 ? (totalIngQty / itemQty) : 0;
                    const price = Number(ingData.price || 0);

                    if (ing.dataValues.type === 'ADD') {
                        toppingsCost += (price * unitQty);
                        ingredientsDisplay.push({
                            ingredientId: ingData.id, name: `+ ${ingData.name}`,
                            price: price, quantity: unitQty, totalPrice: price * unitQty, type: 'ADD'
                        });
                    } else {
                        ingredientsDisplay.push({
                            ingredientId: ingData.id, name: `KHÔNG LẤY ${ingData.name}`,
                            price: 0, quantity: unitQty, totalPrice: 0, type: 'REMOVE'
                        });
                    }
                }

                itemUnitPrice = singleProductPrice + toppingsCost;

                finalItemObj = {
                    cartItemId: item.dataValues.id,
                    type: 'SINGLE',
                    name: productData.dataValues.name,
                    imageUrl: productData.dataValues.imageUrl,
                    unitPrice: itemUnitPrice,
                    quantity: itemQty,
                    totalPrice: itemUnitPrice * itemQty,
                    rawData: {
                        productId: productData.dataValues.id,
                        productVariantId: variantData.dataValues.id,
                    },
                    details: {
                        variantName: variantData.dataValues.name,
                        size: variantData.dataValues.size,
                        crust: variantData.dataValues.type,
                        ingredients: ingredientsDisplay
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

    async cartPreview(cartId: number, cartItemIds: number[]): Promise<CartPreviewOutput> {
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
            }),
            this.productModel.findAll({
                where: { id: { [Op.in]: Array.from(allProductIdsInCombos) } },
                attributes: ['id', 'name', 'basePrice'], // Đảm bảo có basePrice
            }),
            this.productVariantModel.findAll({
                where: { id: { [Op.in]: Array.from(allVariantIdsInCombos) } },
                attributes: ['id', 'name', 'size', 'type', 'modifiedPrice'],
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

                        // Giá biến thể (Upsize/Đế...). Nếu null/undefined thì là 0.
                        const variantSurcharge = Number(vData.modifiedPrice || 0);

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
                                console.log(ingData);

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
                        discountPercentage: discountPercent,
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
                        return sum + (ingPrice * unitQty)
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
                            totalPrice: price * unitQty,
                            type: 'ADD' as const
                        };
                    } else {
                        return {
                            name: `KHÔNG LẤY ${ingData.name}`,
                            price: 0,
                            quantity: unitQty,
                            totalPrice: 0,
                            type: 'REMOVE' as const
                        };
                    }
                }).filter((item): item is NonNullable<typeof item> => item !== null);

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
                        ingredients: ingredientsDisplay
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

    async checkoutCaculate(userId: number, cartId: number, dto: CheckoutCaculateDto): Promise<any> {
        const cartPrev = await this.cartPreview(cartId, dto.cartItemId)

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
            const validateCoupon = await this.couponService.validateCoupon(userId, dto.couponCode, cartPrev.data.totalAmount);
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
