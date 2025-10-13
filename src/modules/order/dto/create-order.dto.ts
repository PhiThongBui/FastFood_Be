import { EnumRequired, NumberNotRequired, NumberRequired, StringNotRequired } from "@/common/decorators";
import { PAYMENTMETHOD } from "@/models/order.model";
import { IsArray } from "sequelize-typescript";

export class CreateOrderDto {

    @NumberRequired('User Id', 1)
    userId: number

    @NumberRequired('Address Id', 1)
    addressId: number

    @IsArray
    orderItems: Array<{
        productId: number
        productVariantId?: number,
        quantity: number
        ingredients?: Array<{
            ingredientId: number,
            quantity: number
        }>,
    }>
    @StringNotRequired
    note?: string
    @NumberNotRequired
    discount?: number
    
    @EnumRequired('Phuong thuc thanh toan', PAYMENTMETHOD)
    paymentMethod: PAYMENTMETHOD
}