// dto/update-cart-item.dto.ts

import { IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ComboOptionDto, IngredientOptionDto } from './cart-item.dto';

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiProperty({ 
    example: 2, 
    required: false, 
    description: 'Số lượng mới' 
  })
  quantity?: number;

  // ===== For SINGLE product =====
  @IsNumber()
  @IsOptional()
  @ApiProperty({ 
    required: false,
    example: 8,
    description: 'Product Variant ID mới (cho món lẻ)' 
  })
  productVariantId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientOptionDto)
  @IsOptional()
  @ApiProperty({ 
    type: [IngredientOptionDto],
    required: false,
    description: 'Ingredients mới (cho món lẻ)',
    example: [
      {
        ingredientId: 1,
        quantity: 1,
        type: 'ADD'
      }
    ]
  })
  singleProductOptions?: IngredientOptionDto[];

  // ===== For COMBO =====
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboOptionDto)
  @IsOptional()
  @ApiProperty({ 
    type: [ComboOptionDto],
    required: false,
    description: 'Cấu hình combo mới',
    example: [
      {
        productId: 10,
        productVariantId: 25,
        ingredients: [
          {
            ingredientId: 3,
            quantity: 2,
            type: 'ADD'
          }
        ]
      },
      {
        productId: 15,
        productVariantId: 30
      }
    ]
  })
  selectedOptions?: ComboOptionDto[];
}
