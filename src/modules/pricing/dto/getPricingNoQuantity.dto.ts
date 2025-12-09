import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class GetPricingNoQuantityDto {
  @ApiProperty({
    example: 12,
    description: 'ID của biến thể sản phẩm',
  })
  @IsInt()
  @IsNotEmpty()
  productVariantId: number;
}