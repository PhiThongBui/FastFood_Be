import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class GetPricingNoQuantityDto {
  @ApiPropertyOptional({
    description: 'ID của biến thể sản phẩm',
  })
  @IsInt()
  @IsOptional()
  productVariantId?: number;

  @ApiPropertyOptional({
    description: 'ID của sản phẩm không có biến thể',
  })
  @IsInt()
  @IsOptional()
  productId?: number
}
