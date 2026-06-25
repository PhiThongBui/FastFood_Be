import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, ValidateNested, ValidateIf } from "class-validator";
import { Type } from "class-transformer";
import { NumberRequired } from "@/common/decorators";

export class IngredientOptionDto {
    @IsNumber()
    @IsNotEmpty()
    ingredientId: number;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsEnum(['ADD', 'REMOVE'])
    type: 'ADD' | 'REMOVE';
}

export class ComboOptionDto {
    @IsNumber()
    @IsNotEmpty()
    comboItemId: number;

    @IsNumber()
    @IsNotEmpty()
    slotIndex: number;

    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsNumber()
    @IsNotEmpty()
    productVariantId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientOptionDto)
    @IsOptional()
    ingredients?: IngredientOptionDto[];
}

export class CreateCartItemDto {
    // Required nếu KHÔNG phải combo, Optional nếu là combo
    @ValidateIf(o => !o.comboId)
    @IsNumber()
    @IsNotEmpty()
    productId?: number;

    @ValidateIf(o => !o.comboId)
    @IsNumber()
    @IsNotEmpty()
    productVariantId?: number;

    // 🔥 MỚI: Thêm vào đây để hỗ trợ món lẻ (Single Product) có ADD/REMOVE
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientOptionDto) // Tái sử dụng DTO của Ingredient
    singleProductOptions?: IngredientOptionDto[];

    @NumberRequired('Số lượng', 1)
    quantity: number;

    // Cho combo
    @IsOptional()
    @IsNumber()
    comboId?: number;

    @ValidateIf(o => !!o.comboId)
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ComboOptionDto)
    comboOptions?: ComboOptionDto[];
}
