import { ArrayNotRequired, NumberNotRequired, NumberRequired, StringNotRequired } from "@/common/decorators";
import { IsNumber, IsOptional } from "class-validator";
import { IsArray } from "class-validator";

export class CreateCartItemDto {
    @NumberRequired('Id sản phẩm', 1)
    productId: number;

    @NumberRequired('Id của biến thế', 1)
    productVariantId: number;

    @IsOptional()
    @IsArray()  // Validate property is array
    @IsNumber({}, { each: true })  // Validate each element is number
    ingredientId?: number[];


    @NumberRequired('Số lượng biến thể mua', 1)
    quantity: number;

    @NumberNotRequired
    userId?: number

    @StringNotRequired
    sessionId?: string
}