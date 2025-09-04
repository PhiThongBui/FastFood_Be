import { CartItems, Carts, Product, ProductVariant } from '@/models';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreateCartItemDto } from './dto/cart-item.dto';
import { ProductService } from '../product/product.service';
import { ProductVariantService } from '../product-variant/product-variant.service';
import { CartService } from '../cart/cart.service';
import e, { raw } from 'express';
import { log } from 'node:console';

@Injectable()
export class CartItemService {
    constructor(
        @InjectModel(Carts) private readonly modelCarts: typeof Carts,
        @InjectModel(CartItems) private readonly modelCartItems: typeof CartItems,
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        private readonly productService: ProductService,
        private readonly productVariantService: ProductVariantService,
        private readonly cartService: CartService,
        private readonly sequelize: Sequelize
    ) { }

    async addToCart(dataAdd: CreateCartItemDto) {
        const { productId, productVariantId, quantity, userId, sessionId } = dataAdd

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

            const existedCartItem = await this.modelCartItems.findOne({
                where: {
                    cartId: cart?.dataValues?.id,
                    productId: productId,
                    productVariantId: productVariantId
                },
                transaction
            })

            if (existedCartItem) {
                await existedCartItem.increment('quantity', {
                    by: quantity,
                    transaction
                });

                // Reload để get latest data
                await existedCartItem.reload({ transaction });
                await transaction.commit()

                return {
                    message: 'Đã tăng số lượng biến thể trong giỏ hàng!!!',
                    data: existedCartItem
                }
            } else {
                const newCartItem = await this.modelCartItems.create({
                    cartId: cart?.dataValues?.id,
                    productId: productId,
                    productVariantId: productVariantId,
                    quantity: quantity
                } as CartItems, { transaction })
                await transaction.commit()
                return {
                    message: 'Thêm thành công vào giỏ hàng!!!',
                    data: newCartItem
                }
            }
        } catch (error) {
            console.log(error);
            await transaction.rollback()
            throw error
        }
    }

    async mergerCart(sessionId, userId) {
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
}
