import { actionUpdateCartItem } from './types/cartItem.type';
import { log } from 'node:console';
import { CartItems, CartItemsIngredient, Carts, Combo, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ComboOptionDto, CreateCartItemDto } from './dto/cart-item.dto';
import { ProductService } from '../product/product.service';
import { ProductVariantService } from '../product-variant/product-variant.service';
import { CartService } from '../cart/cart.service';
import { CartItemIngredientService } from '../cart-item-ingredient/cart-item-ingredient.service';
import * as _ from 'lodash';
import { Helper } from '@/utils/helper';
interface AddToCartParams extends CreateCartItemDto {
    userId?: number;
    sessionId?: string;
}
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
        private readonly productService: ProductService,
        private readonly cartItemIngredientSerivce: CartItemIngredientService,
        private readonly productVariantService: ProductVariantService,
        private readonly cartService: CartService,

        private readonly sequelize: Sequelize
    ) { }

    // async addToCart(dataAdd: AddToCartParams) {
    //     const { productId, productVariantId, quantity, userId, sessionId, ingredientId } = dataAdd


    //     const transaction = await this.sequelize.transaction()

    //     try {

    //         if (quantity <= 0) {
    //             throw new BadGatewayException('Số lượng biến thể phải lớn hơn 0 !!!')
    //         }

    //         const existedProduct = await this.productService.findOneProductById(productId)
    //         if (!existedProduct) throw new BadGatewayException('Sản phẩm chưa được tìm thấy!')
    //         const existedProductVariant = await this.productVariantService.findById(productVariantId)
    //         if (!existedProductVariant) throw new BadGatewayException('Biến thể chưa được tìm thấy!')

    //         const cart = await this.cartService.getCartByContext(sessionId, userId, transaction)

    //         const ingredientIds = ingredientId ?? []
    //         const matchingCartItem = await this.matchingCartItem(cart.id, productId, productVariantId, ingredientIds)


    //         if (matchingCartItem) {

    //             await matchingCartItem.increment('quantity', {
    //                 by: quantity,
    //                 transaction
    //             })

    //             await matchingCartItem.reload({
    //                 transaction
    //             })

    //             if (ingredientIds.length > 0) {
    //                 const upQuantityCartItemIngredient = await this.modelCartItemIngredient.findAll({
    //                     where: {
    //                         cartItemId: matchingCartItem.id
    //                     }
    //                 })

    //                 await Promise.all(upQuantityCartItemIngredient.map(async (item) => {
    //                     await item.increment('quantity', {
    //                         by: quantity,
    //                         transaction
    //                     })
    //                 }))
    //             }

    //             await transaction.commit()
    //             return {
    //                 message: 'Đã tăng số lượng thành công!',
    //                 data: matchingCartItem
    //             }
    //         } else {

    //             const newCartItem = await this.modelCartItems.create({
    //                 cartId: cart.id,
    //                 productId: productId,
    //                 productVariantId: productVariantId,
    //                 quantity: quantity,
    //             } as CartItems, {
    //                 transaction
    //             })


    //             if (ingredientIds.length > 0) {
    //                 for (const id of ingredientIds) {
    //                     await this.modelCartItemIngredient.create({
    //                         cartItemId: newCartItem.id,
    //                         ingredientId: id,
    //                         quantity: quantity
    //                     } as CartItemsIngredient, {
    //                         transaction,
    //                     })
    //                 }
    //             }

    //             await transaction.commit()

    //             return {
    //                 message: 'Them vao gio hang thanh cong!',
    //             }
    //         }
    //     } catch (error) {

    //         console.log(error);
    //         await transaction.rollback()
    //         throw error
    //     }
    // }


    async addToCart(dataAdd: AddToCartParams) {
        const {
            productId,
            productVariantId,
            quantity,
            userId,
            sessionId,
            ingredientId,
            comboId,
            selectedOptions
        } = dataAdd;

        const transaction = await this.sequelize.transaction();
        try {
            if (quantity <= 0) {
                throw new BadGatewayException('Số lượng phải lớn hơn 0!!!');
            }

            const isCombo = !!comboId;

            // Validate combo
            if (isCombo) {
                if (!comboId || !selectedOptions || selectedOptions.length === 0) {
                    throw new BadGatewayException('Dữ liệu combo không hợp lệ!');
                }

                const existedCombo = await this.modelCombo.findByPk(comboId);
                if (!existedCombo) throw new BadGatewayException('Combo không tồn tại!');

                await this.validateComboOptions(selectedOptions, transaction);
            }
            // Validate món lẻ
            else {
                if (!productId || !productVariantId) {
                    throw new BadGatewayException('Thiếu thông tin sản phẩm!');
                }

                const existedProduct = await this.modelProduct.findByPk(productId);
                if (!existedProduct) throw new BadGatewayException('Sản phẩm không tồn tại!');

                const existedProductVariant = await this.productVariantService.findById(productVariantId);
                if (!existedProductVariant) throw new BadGatewayException('Biến thể không tồn tại!');
            }

            const cart = await this.cartService.getCartByContext(sessionId, userId, transaction);

            let matchingCartItem: CartItems | null;

            if (isCombo && comboId && selectedOptions) {
                matchingCartItem = await this.matchingComboCartItem(
                    cart.id,
                    comboId,
                    selectedOptions
                );
            } else if (!isCombo && productId && productVariantId) {
                const ingredientIds = ingredientId ?? [];
                matchingCartItem = await this.matchingRegularCartItem(
                    cart.id,
                    productId,
                    productVariantId,
                    ingredientIds
                );
            } else {
                throw new BadGatewayException('Dữ liệu không hợp lệ!');
            }

            // Nếu tìm thấy -> tăng số lượng
            if (matchingCartItem) {
                await matchingCartItem.increment('quantity', {
                    by: quantity,
                    transaction
                });

                await matchingCartItem.reload({ transaction });

                if (!isCombo && ingredientId && ingredientId.length > 0) {
                    const cartItemIngredients = await this.modelCartItemIngredient.findAll({
                        where: { cartItemId: matchingCartItem.id },
                        transaction
                    });

                    await Promise.all(cartItemIngredients.map(item =>
                        item.increment('quantity', { by: quantity, transaction })
                    ));
                }

                await transaction.commit();
                return {
                    message: 'Đã tăng số lượng thành công!',
                    data: matchingCartItem
                };
            }

            // Tạo mới
            const newCartItem = await this.modelCartItems.create({
                cartId: cart.id,
                productId: isCombo ? null : productId,  // Null nếu combo
                productVariantId: isCombo ? null : productVariantId,  // Null nếu combo
                comboId: isCombo ? comboId : null,
                selectedOptions: isCombo ? selectedOptions : null,
                quantity: quantity,
            } as CartItems, {
                transaction
            });

            if (!isCombo && ingredientId && ingredientId.length > 0) {
                const cartItemIngredients = ingredientId.map(id => ({
                    cartItemId: newCartItem.id,
                    ingredientId: id,
                    quantity: quantity
                }));

                await this.modelCartItemIngredient.bulkCreate(
                    cartItemIngredients as CartItemsIngredient[],
                    { transaction }
                );
            }

            await transaction.commit();

            return {
                message: 'Thêm vào giỏ hàng thành công!',
                data: newCartItem
            };

        } catch (error) {
            console.log(error);
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
        ingredientIds: number[]
    ): Promise<CartItems | null> {
        const candidates = await this.modelCartItems.findAll({
            where: {
                cartId: cartId,
                productId: productId,
                productVariantId: productVariantId,
                comboId: null // Quan trọng: chỉ lấy món lẻ
            }
        });

        if (candidates.length === 0) return null;

        const sortedIngredientIds = [...ingredientIds].sort((a, b) => a - b);

        for (const item of candidates) {
            const itemIngredients = await this.modelCartItemIngredient.findAll({
                where: { cartItemId: item.id },
                attributes: ['ingredientId']
            });

            const sortedItemIngredients = itemIngredients
                .map(ing => ing.get('ingredientId'))
                .sort((a, b) => a - b);

            if (Helper.isEqualArray(sortedIngredientIds, sortedItemIngredients)) {
                return item;
            }
        }

        return null;
    };

    /**
     * Tìm combo cart item khớp chính xác
     */
    async matchingComboCartItem(
        cartId: number,
        comboId: number,
        selectedOptions: ComboOptionDto[]
    ): Promise<CartItems | null> {
        const candidates = await this.modelCartItems.findAll({
            where: {
                cartId: cartId,
                comboId: comboId
            }
        })

        if (candidates.length === 0) return null;

        // 1. Chuẩn hóa dữ liệu gửi lên
        const normalizedPayload = this.normalizeComboOptions(selectedOptions);
        const payloadSignature = JSON.stringify(normalizedPayload); // Tạo chữ ký chuỗi

        for (const item of candidates) {
            // 2. Lấy dữ liệu từ DB và chuẩn hóa y hệt
            // Quan trọng: item.getDataValue('selectedOptions') hoặc item.selectedOptions
            const dbOptions = item.getDataValue('selectedOptions') || [];

            const normalizedDbData = this.normalizeComboOptions(dbOptions);
            const dbSignature = JSON.stringify(normalizedDbData);

            // 3. So sánh chuỗi
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
                    productId: Number(opt.productId),
                    productVariantId: Number(opt.productVariantId),
                    ingredients: normalizedIngredients // Luôn luôn có key ingredients
                };
            })
            .sort((a, b) => {
                if (a.productId !== b.productId) return a.productId - b.productId;
                return a.productVariantId - b.productVariantId;
            });
    }

    /**
     * Validate các món trong combo có tồn tại không
     */
    private async validateComboOptions(
        options: ComboOptionDto[],
        transaction: any
    ): Promise<void> {
        console.log("options", options)

        for (const option of options) {
            const product = await this.modelProduct.findByPk(option.productId);
            if (!product) {
                throw new BadGatewayException(`Sản phẩm ${option.productId} không tồn tại!`);
            }

            const variant = await this.productVariantService.findById(option.productVariantId);
            if (!variant) {
                throw new BadGatewayException(`Biến thể ${option.productVariantId} không tồn tại!`);
            }

            // Validate ingredients nếu có
            if (option.ingredients && option.ingredients.length > 0) {
                const ingredientIds = option.ingredients.map(ing => ing.ingredientId);
                const existingIngredients = await this.modelIngredient.findAll({
                    where: {
                        id: ingredientIds  // Sequelize tự động dùng IN operator
                    },
                    transaction
                });

                if (existingIngredients.length !== ingredientIds.length) {
                    throw new BadGatewayException('Một số ingredient không tồn tại!')
                }
            }
        }
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

    async deleteCartItem(cartItemId: number) {
        const transaction = await this.sequelize.transaction()
        try {
            await this.modelCartItems.destroy({
                where: {
                    id: cartItemId
                },
                transaction
            })

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



    // async mergerCart(sessionId: string, userId: number) {
    //     const transaction = await this.sequelize.transaction()
    //     try {
    //         const guestCart = await this.modelCarts.findOne({
    //             where: {
    //                 sessionId: sessionId,
    //             },
    //             include: [
    //                 {
    //                     model: this.modelCartItems,
    //                     include: [
    //                         {
    //                             model: this.modelProductVariant,
    //                             attributes: ['id', 'name', 'size', 'type', 'modifiedPrice']
    //                         },
    //                         {
    //                             model: this.modelProduct,
    //                             attributes: ['name', 'basePrice', 'imageUrl']
    //                         }
    //                     ]
    //                 }
    //             ]
    //             , transaction
    //         })

    //         if (!guestCart) throw new BadGatewayException('Giỏ hàng khóa chưa được tìm thấy!')

    //         console.log("guestCart", guestCart);

    //         const userCart = await this.cartService.getOrCreateUserCart(userId, transaction)

    //         for (const cartItem of guestCart.dataValues.cartItems) {
    //             const alreadyExistedCartItem = await this.modelCartItems.findOne({
    //                 where: {
    //                     cartId: userCart?.dataValues?.id,
    //                     productId: cartItem?.dataValues?.productId,
    //                     productVariantId: cartItem?.dataValues?.productVariantId
    //                 }
    //             })

    //             if (alreadyExistedCartItem) {
    //                 await alreadyExistedCartItem.increment('quantity', {
    //                     by: cartItem?.dataValues.quantity,
    //                     transaction
    //                 });

    //                 await alreadyExistedCartItem.reload({ transaction });

    //             } else {
    //                 const newCartItem = await this.modelCartItems.create({
    //                     cartId: userCart?.dataValues?.id,
    //                     productId: cartItem?.dataValues.productId,
    //                     productVariantId: cartItem?.dataValues?.productVariantId,
    //                     quantity: cartItem?.dataValues?.quantity
    //                 } as CartItems, { transaction })
    //             }
    //         }

    //         await this.modelCartItems.destroy({
    //             where: {
    //                 cartId: guestCart.dataValues.id
    //             },
    //             transaction
    //         })
    //         await this.modelCarts.destroy({
    //             where: {
    //                 sessionId: sessionId
    //             },
    //             transaction
    //         })
    //         await transaction.commit();
    //         return {
    //             message: 'Merge Cart thành công và tăng số lượng biến thể trong giỏ hàng!!!',
    //         }

    //     } catch (error) {
    //         console.log(error);
    //         await transaction.rollback()
    //         throw error
    //     }
    // }

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
                        { model: this.modelCartItemIngredient } // Lấy topping món lẻ
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
                    guestItem.selectedOptions
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
                    guestIngredientIds
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

}
