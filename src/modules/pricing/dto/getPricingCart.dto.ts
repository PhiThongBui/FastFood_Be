import { NumberRequired } from '@/common/decorators';
import { productIngredients } from './../../seeder/data/data';
export class GetPricingCartDto {
    @NumberRequired('Cart Item Id', 1)
    cartItemId: number;

    @NumberRequired('Ingredient Id', 1)
    quantity: number;
}

export class ResponseGetPricingCartDto {
    productId: number;
    productVariantId: number;
    quantity: number;
    price: number;
}