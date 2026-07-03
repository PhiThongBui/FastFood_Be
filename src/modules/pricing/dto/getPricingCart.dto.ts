import { NumberRequired } from '@/common/decorators';
export class GetPricingCartDto {
    @NumberRequired('Cart Item Id', 1)
    cartItemId!: number;

    @NumberRequired('Ingredient Id', 1)
    quantity!: number;
}

export class ResponseGetPricingCartDto {
    @NumberRequired('Product Id', 1)
    productId!: number;

    @NumberRequired('Product Variant Id', 1)
    productVariantId!: number;

    @NumberRequired('Quantity', 1)
    quantity!: number;

    @NumberRequired('Price', 1)
    price!: number;
}