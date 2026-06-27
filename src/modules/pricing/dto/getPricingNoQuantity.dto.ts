import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class GetPricingNoQuantityDto {
  @ApiProperty({
    description: 'ID cua bien the san pham duoc chon de doi mon trong combo',
  })
  @IsInt()
  @IsNotEmpty()
  productVariantId!: number;

  @ApiProperty({
    description: 'ID combo item goc khi tinh surcharge doi mon trong combo',
  })
  @IsInt()
  @IsNotEmpty()
  comboItemId!: number;
}

export class GetPricingFeatureDto {
  @ApiPropertyOptional({
    description: 'ID cua bien the san pham',
  })
  @IsInt()
  @IsOptional()
  productVariantId?: number;

  @ApiPropertyOptional({
    description: 'ID cua san pham khong co bien the',
  })
  @IsInt()
  @IsOptional()
  productId?: number;
}
