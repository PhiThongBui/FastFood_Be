import { Helper } from '@/utils/helper';
import { CartCheckoutOutput, CartPreviewItem, CartPreviewOutput } from './types/cart-prev.type';
import { Address, CartItems, CartItemsIngredient, Combo, Ingredient, Product, ProductVariant } from '@/models';
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
        private readonly addressService: AddressService,
        private readonly couponService: CouponService,
        private readonly sequelize: Sequelize,
    ) { }

    async getUserCartPreview(cartId: number): Promise<CartPreviewOutput> {
        // 1. Query CartItems (Giữ nguyên đoạn query của bạn)
        const cartItems = await this.cartItemsModel.findAll({
            where: { cartId: cartId },
            include: [
                { model: this.productModel, attributes: ['id', 'name', 'basePrice', 'imageUrl'], required: false },
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

            // ================= CASE A: COMBO (Đã sửa logic tính giá) =================
            // ================= CASE A: COMBO (Đã sửa logic tính giá) =================
            if (isCombo) {
                const comboInstance = item.dataValues.combo;
                if (!comboInstance) continue;

                const comboData = comboInstance.dataValues;
                const options = item.dataValues.selectedOptions;

                // 1. KHỞI TẠO GIÁ TỪ GIÁ GỐC CỦA COMBO (Thay vì bắt đầu từ 0)
                let currentComboTotal = Number(comboData.price || 0); // Ví dụ: 199.000đ

                const comboDetailsDisplay: any[] = [];
                const enrichedOptions: any[] = [];

                if (options) {
                    for (const opt of options) {
                        const pInstance = productMap.get(opt.productId);
                        const vInstance = variantMap.get(opt.productVariantId);

                        if (!pInstance || !vInstance) continue;

                        const pData = pInstance.dataValues;
                        const vData = vInstance.dataValues;

                        // --- QUAN TRỌNG: LOGIC TÍNH TIỀN ---
                        // KHÔNG cộng pData.basePrice vào đây (vì nó đã nằm trong giá Combo rồi)
                        // CHỈ cộng modifiedPrice (phụ phí nâng size)
                        const variantSurcharge = Number(vData.modifiedPrice || 0);

                        // Biến này chỉ dùng để tính tổng phụ phí của item này (Variant + Topping)
                        let itemSurchargeTotal = variantSurcharge;

                        // Cộng phụ phí variant vào tổng giá Combo
                        currentComboTotal += variantSurcharge;

                        // --- XỬ LÝ TOPPING ---
                        const enrichedIngredients: any[] = [];
                        const ingNames: string[] = [];

                        if (opt.ingredients) {
                            for (const ing of opt.ingredients) {
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

                                    // Cộng tiền topping vào tổng giá Combo
                                    const toppingCost = price * qty;
                                    currentComboTotal += toppingCost;
                                    itemSurchargeTotal += toppingCost; // Để track riêng item này tốn thêm bao nhiêu

                                    ingNames.push(`+ ${ingData.name} (x${qty})`);
                                } else if (ing.type === 'REMOVE') {
                                    ingNames.push(`KHÔNG LẤY ${ingData.name}`);
                                }
                            }
                        }

                        // Display Info
                        comboDetailsDisplay.push({
                            productName: pData.name,
                            variantName: `${vData.size} - ${vData.type}`,
                            ingredients: ingNames,
                            surcharge: itemSurchargeTotal // (Optional) Để hiển thị cho user biết món này phụ thu bao nhiêu
                        });

                        // Enriched Option Structure
                        enrichedOptions.push({
                            productId: opt.productId,
                            productVariantId: opt.productVariantId,
                            ingredients: enrichedIngredients,
                            product: {
                                id: pData.id,
                                name: pData.name,
                                imageUrl: pData.imageUrl || '',
                                basePrice: pData.basePrice, // Vẫn giữ để tham khảo, nhưng ko dùng tính tổng
                            },
                            variant: {
                                id: vData.id,
                                name: vData.name,
                                size: vData.size,
                                type: vData.type,
                                modifiedPrice: vData.modifiedPrice,
                            }
                        });
                    }
                }

                // 2. ÁP DỤNG GIẢM GIÁ (Nếu Combo có logic giảm giá thêm trên tổng bill)
                // Lưu ý: Thường giá combo đã là giá giảm rồi, discountPercentage này 
                // có thể là khuyến mãi đặc biệt (VD: Giờ vàng giảm thêm 10%)
                const discountPercent = Number(comboData.discountPercentage || 0);
                const finalPriceAfterDiscount = currentComboTotal * (1 - (discountPercent / 100));

                // Làm tròn tiền
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
                        originalPrice: currentComboTotal, // Giá gốc trước khi giảm % (nếu có)
                        discountPercentage: discountPercent,
                        savedAmount: (currentComboTotal - itemUnitPrice) // Tiền tiết kiệm được
                    }
                };
            }
            // ================= CASE B: SINGLE =================
            else {
                const productData = item.dataValues.product;
                console.log("productData", productData);

                const variantData = item.dataValues.productVariant;
                const cartItemIngredients = item.dataValues.cartItemIngredients || [];

                if (!productData || !variantData) {
                    console.warn(`⚠️ Missing product or variant for cartItem ${item.dataValues.id}`);
                    continue;
                }

                // ========================================
                // BƯỚC 1: LẤY GIÁ CƠ BẢN
                // ========================================
                const basePrice = Number(productData.dataValues.basePrice || 0);
                const variantSurcharge = Number(variantData.dataValues.modifiedPrice || 0);

                // Giá cơ bản = giá sản phẩm + phụ phí variant (size/type)
                let singleProductPrice = basePrice + variantSurcharge;

                console.log(`🍕 Processing SINGLE item ${item.dataValues.id}:`);
                console.log(`  Product: ${productData.dataValues.name}`);
                console.log(`  Base Price: ${basePrice.toLocaleString()}₫`);
                console.log(`  Variant Surcharge: ${variantSurcharge.toLocaleString()}₫`);
                console.log(`  Initial Price: ${singleProductPrice.toLocaleString()}₫`);

                // ========================================
                // BƯỚC 2: TÍNH GIÁ TOPPING
                // ========================================
                let toppingsCost = 0;

                for (const ing of cartItemIngredients) {
                    const ingInstance = ing.dataValues.ingredient;
                    if (!ingInstance) {
                        console.warn(`  ⚠️ Missing ingredient instance for cartItemIngredient ${ing.dataValues.id}`);
                        continue;
                    }

                    const ingData = ingInstance.dataValues;

                    // Chỉ tính giá cho ingredients ADD
                    if (ing.dataValues.type === 'ADD') {
                        const ingPrice = Number(ingData.price || 0);
                        const totalIngQty = Number(ing.dataValues.quantity || 0);

                        // Tính số lượng ingredient trên 1 pizza
                        // VD: 2 pizzas có 2 "Viền phô mai" → mỗi pizza có 1
                        const unitIngQty = itemQty > 0 ? (totalIngQty / itemQty) : 0;

                        // Giá topping trên 1 pizza
                        const costPerPizza = ingPrice * unitIngQty;

                        toppingsCost += costPerPizza;

                        console.log(`  + ${ingData.name}:`);
                        console.log(`    Price: ${ingPrice.toLocaleString()}₫`);
                        console.log(`    Quantity per pizza: ${unitIngQty}`);
                        console.log(`    Cost per pizza: ${costPerPizza.toLocaleString()}₫`);
                    } else {
                        console.log(`  - REMOVE: ${ingData.name} (no cost)`);
                    }
                }

                // ========================================
                // BƯỚC 3: TỔNG GIÁ
                // ========================================
                itemUnitPrice = singleProductPrice + toppingsCost;

                console.log(`  Toppings Total: ${toppingsCost.toLocaleString()}₫`);
                console.log(`  ✅ Final Unit Price: ${itemUnitPrice.toLocaleString()}₫`);
                console.log(`  Quantity: ${itemQty}`);
                console.log(`  💰 Total Price: ${(itemUnitPrice * itemQty).toLocaleString()}₫\n`);

                // ========================================
                // BƯỚC 4: FORMAT DISPLAY
                // ========================================
                const ingredientsDisplay = cartItemIngredients.map(ing => {
                    const ingInstance = ing.dataValues.ingredient;
                    if (!ingInstance) return null;

                    const ingData = ingInstance.dataValues;
                    const totalIngQty = Number(ing.dataValues.quantity || 0);
                    const unitQty = itemQty > 0 ? (totalIngQty / itemQty) : 0;
                    const price = Number(ingData.price || 0);

                    if (ing.dataValues.type === 'ADD') {
                        return {
                            ingredientId: ingData.id,
                            name: `+ ${ingData.name}`,
                            price: price,
                            quantity: unitQty,
                            totalPrice: price * unitQty,
                            type: 'ADD' as const
                        };
                    } else {
                        return {
                            ingredientId: ingData.id,
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
                    unitPrice: itemUnitPrice,              // ✅ Giá 1 pizza (đã có topping)
                    quantity: itemQty,
                    totalPrice: itemUnitPrice * itemQty,   // ✅ Tổng giá = unitPrice × số lượng

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
                        console.log("basePrice", basePrice);

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
                console.log(discountPercent);

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
