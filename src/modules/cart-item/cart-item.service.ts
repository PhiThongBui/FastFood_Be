import { log } from 'node:console';
import { CartItems, CartItemsIngredient, Carts, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreateCartItemDto } from './dto/cart-item.dto';
import { ProductService } from '../product/product.service';
import { ProductVariantService } from '../product-variant/product-variant.service';
import { CartService } from '../cart/cart.service';
import { CartItemIngredientService } from '../cart-item-ingredient/cart-item-ingredient.service';
import e from 'express';
import { Helper } from '@/utils/helper';

@Injectable()
export class CartItemService {
    constructor(
        @InjectModel(Carts) private readonly modelCarts: typeof Carts,
        @InjectModel(CartItems) private readonly modelCartItems: typeof CartItems,
        @InjectModel(CartItemsIngredient) private readonly modelCartItemIngredient: typeof CartItemsIngredient,
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
        private readonly productService: ProductService,
        private readonly cartItemIngredientSerivce: CartItemIngredientService,
        private readonly productVariantService: ProductVariantService,
        private readonly cartService: CartService,
        private readonly sequelize: Sequelize
    ) { }

    async addToCart(dataAdd: CreateCartItemDto) {
        const { productId, productVariantId, quantity, userId, sessionId, ingredientId } = dataAdd


        const transaction = await this.sequelize.transaction()

        try {

            if (quantity <= 0) {
                throw new BadGatewayException('Số lượng biến thể phải lớn hơn 0 !!!')
            }

            const existedProduct = await this.productService.findOneProductById(productId)
            if (!existedProduct) throw new BadGatewayException('Sản phẩm chưa được tìm thấy!')
            const existedProductVariant = await this.productVariantService.findById(productVariantId)
            if (!existedProductVariant) throw new BadGatewayException('Biến thể chưa được tìm thấy!')

            const cart = await this.cartService.getCartByContext(sessionId, userId, transaction)

            const ingredientIds = ingredientId ?? []
            const matchingCartItem = await this.matchingCartItem(cart.id, productId, productVariantId, ingredientIds)

            console.log("matchingCartItem", matchingCartItem );
            
            if (matchingCartItem) {

                await matchingCartItem.increment('quantity', {
                    by: quantity,
                    transaction
                })

                await matchingCartItem.reload({
                    transaction
                })

                if (ingredientIds.length > 0) {
                    const upQuantityCartItemIngredient = await this.modelCartItemIngredient.findAll({
                        where: {
                            cartItemId: matchingCartItem.id
                        }
                    })

                    await Promise.all(upQuantityCartItemIngredient.map(async (item) => {
                        await item.increment('quantity', {
                            by: quantity,
                            transaction
                        })
                    }))
                }

                await transaction.commit()
                return {
                    message: 'Đã tăng số lượng thành công!',
                    data: matchingCartItem
                }
            }else {

                const newCartItem = await this.modelCartItems.create({
                    cartId: cart.id,
                    productId: productId,
                    productVariantId: productVariantId,
                    quantity: quantity,
                } as CartItems, {
                    transaction
                })


                if(ingredientIds.length > 0) {
                    for(const id of ingredientIds) {
                         await this.modelCartItemIngredient.create({
                            cartItemId: newCartItem.id,
                            ingredientId: id,
                            quantity: quantity
                        } as CartItemsIngredient, {
                            transaction,
                        })
                    }
                }

                await transaction.commit()

                return {
                    message: 'Them vao gio hang thanh cong!',
                }
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
                productVariantId:  productVariantId
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
     * So sánh 2 mảng có giống nhau không
     */



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
    }



    async mergerCart(sessionId: string, userId: number) {
        const transaction = await this.sequelize.transaction()
        try {
            const guestCart = await this.modelCarts.findOne({
                where: {
                    sessionId: sessionId,
                    isActive: true
                },
                include: [
                    {
                        model: this.modelCartItems,
                        include: [
                            {
                                model: this.modelProductVariant,
                                attributes: ['id', 'name', 'size', 'type', 'modifiedPrice']
                            },
                            {
                                model: this.modelProduct,
                                attributes: ['name', 'basePrice', 'imageUrl']
                            }
                        ]
                    }
                ]
                , transaction
            })

            if (!guestCart) throw new BadGatewayException('Giỏ hàng khóa chưa được tìm thấy!')

            console.log("guestCart", guestCart);

            const userCart = await this.cartService.getOrCreateUserCart(userId, transaction)

            for (const cartItem of guestCart.dataValues.cartItems) {
                const alreadyExistedCartItem = await this.modelCartItems.findOne({
                    where: {
                        cartId: userCart?.dataValues?.id,
                        productId: cartItem?.dataValues?.productId,
                        productVariantId: cartItem?.dataValues?.productVariantId
                    }
                })

                if (alreadyExistedCartItem) {
                    await alreadyExistedCartItem.increment('quantity', {
                        by: cartItem?.dataValues.quantity,
                        transaction
                    });

                    await alreadyExistedCartItem.reload({ transaction });

                } else {
                    const newCartItem = await this.modelCartItems.create({
                        cartId: userCart?.dataValues?.id,
                        productId: cartItem?.dataValues.productId,
                        productVariantId: cartItem?.dataValues?.productVariantId,
                        quantity: cartItem?.dataValues?.quantity
                    } as CartItems, { transaction })
                }
            }

            await this.modelCartItems.destroy({
                where: {
                    cartId: guestCart.dataValues.id
                },
                transaction
            })
            await this.modelCarts.destroy({
                where: {
                    sessionId: sessionId
                },
                transaction
            })
            await transaction.commit();
            return {
                message: 'Merge Cart thành công và tăng số lượng biến thể trong giỏ hàng!!!',
            }

        } catch (error) {
            console.log(error);
            await transaction.rollback()
            throw error
        }
    }

    async getCartItemsById(idCart: number) {
        return await this.modelCartItems.findByPk(idCart);
    }
}
