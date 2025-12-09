import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class GetPricingNoQuantityDto {
  @ApiProperty({
    description: 'ID của biến thể sản phẩm',
  })
  @IsInt()
  @IsNotEmpty()
  productVariantId: number;

 @ApiProperty({
    description: 'ID của sản phẩm',
  })
  @IsInt()
  @IsNotEmpty()
  productId: number;

}