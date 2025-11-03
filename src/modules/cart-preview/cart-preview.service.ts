import { Helper } from '@/utils/helper';
import { CartCheckoutOutput, CartPreviewItem, CartPreviewOutput } from './types/cart-prev.type';
import { Address, CartItems, CartItemsIngredient, Ingredient, Product, ProductVariant } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreateAddressDto } from '../address/dto/addressStore.dto';
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
        private readonly addressService: AddressService,
        private readonly couponService: CouponService,
        private readonly sequelize: Sequelize
    ) { }


    async cartPreview(cartId: number, cartItemIds: number[], transaction: any): Promise<CartPreviewOutput> {

        // 1. Tìm tất cả các cart item được yêu cầu thuộc về giỏ hàng của người dùng
        const cartItems = await this.cartItemsModel.findAll({
            where: {
                id: {
                    [Op.in]: cartItemIds, // Tìm tất cả các ID trong mảng cartItemIds
                },
                cartId: cartId // Đảm bảo các item này thuộc đúng giỏ hàng của người dùng
            },
            include: [
                {
                    model: this.productModel,
                    attributes: ['name', 'basePrice', 'imageUrl'],
                },
                {
                    model: this.productVariantModel,
                    attributes: ['id', 'name', 'size', 'type', 'modifiedPrice'],
                },
                {
                    model: this.cartItemsIngredientModel,
                    attributes: ['id', 'ingredientId', 'quantity'],
                    include: [
                        {
                            model: this.ingredientModel,
                            attributes: ['id', 'name', 'description', 'imageUrl', 'price'],
                        },
                    ],
                },
            ],
            transaction,
        });

        // 2. Xử lý trường hợp không tìm thấy item nào hợp lệ
        if (!cartItems || cartItems.length === 0) {
            throw new BadRequestException('No valid cart items found for preview.');
        }

        let subtotal: number = 0;
        // 3. Xử lý và định dạng dữ liệu cho từng item
        const previewItems: CartPreviewItem[] = cartItems?.map((item) => {
            // Tính tổng tiền của các thành phần thêm (ingredients)
            const ingredientPrice = item.dataValues.cartItemIngredients.reduce(
                (total, ing) => total + (ing.dataValues.ingredient.dataValues.price || 0),
                0
            );

            // Lấy giá của sản phẩm (ưu tiên giá của biến thể)
            const priceProduct: number = item.dataValues.productVariant.dataValues.modifiedPrice ?? item.dataValues.product.dataValues.basePrice;

            // Tính tổng tiền cho một dòng sản phẩm (subtotal)
            subtotal += (priceProduct + ingredientPrice) * item.dataValues.quantity;

            // Định dạng lại danh sách thành phần thêm
            const ingredientItems = item.dataValues.cartItemIngredients.map((ing) => ({
                ingredientId: ing.dataValues.ingredient.dataValues.id,
                ingredientName: ing.dataValues.ingredient.dataValues.name,
                price: ing.dataValues.ingredient.dataValues.price,
            }));
            // Trả về đối tượng đã được định dạng cho item này
            return {
                cartItemId: item.dataValues.id,
                productName: item.dataValues.product.dataValues.name,
                productVariantName: item.dataValues.productVariant.dataValues.name,
                productVariantsize: item.dataValues.productVariant.dataValues.size,
                productVarianttype: item.dataValues.productVariant.dataValues.type,
                priceProduct: priceProduct,
                quantity: item.dataValues.quantity,
                ingredients: ingredientItems,
            };
        });


        // 5. Trả về kết quả cuối cùng
        return {
            message: 'Cart preview generated successfully.',
            data: {
                items: previewItems,
                totalAmount: subtotal,
            },
        };
    }

    async checkoutCaculate(userId:number,cartId: number, dto: CheckoutCaculateDto, transaction: any): Promise<any> {
        const cartPrev = await this.cartPreview(cartId, dto.cartItemId, transaction)

        if (!cartPrev) {
            throw new BadRequestException('No valid cart items found for preview.');
        }
        console.log(cartPrev.data.items);
        let deliveryFee = 0

        if(dto.temporaryAddress){
            const distanceResult = await this.addressService.caculateDistance(dto.temporaryAddress.latitude, dto.temporaryAddress.longitude);
            deliveryFee = Helper.caculateDeliveryFee(distanceResult.distance);
        }else if (dto.addressId) {
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
