import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';

export enum PricingIngredientOptionType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export enum PricingComboCalculationType {
  ADD = 'add',
  UPDATE = 'update',
}

export class PricingIngredientOptionDto {
  @ApiProperty({ description: 'ID ingredient' })
  @IsInt()
  @IsNotEmpty()
  ingredientId!: number;

  @ApiProperty({ description: 'Số lượng ingredient' })
  @IsInt()
  @IsNotEmpty()
  quantity!: number;

  @ApiProperty({ enum: PricingIngredientOptionType, description: 'Loại thao tác ingredient' })
  @IsEnum(PricingIngredientOptionType)
  type!: PricingIngredientOptionType;
}

export class PricingComboOptionDto {
  @ApiProperty({ description: 'ID combo item gốc' })
  @IsInt()
  @IsNotEmpty()
  comboItemId!: number;

  @ApiPropertyOptional({ description: 'Slot index trong combo item, mac dinh la 0' })
  @IsInt()
  @IsOptional()
  slotIndex?: number;

  @ApiPropertyOptional({ description: 'ID san pham duoc chon trong modal' })
  @IsInt()
  @IsOptional()
  productId?: number;

  @ApiProperty({ description: 'ID bien the san pham duoc chon' })
  @IsInt()
  @IsNotEmpty()
  productVariantId!: number;

  @ApiPropertyOptional({ type: [PricingIngredientOptionDto], description: 'Ingredients cua slot nay trong modal' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingIngredientOptionDto)
  @IsOptional()
  ingredients?: PricingIngredientOptionDto[];
}

export class GetPricingNoQuantityDto {
  @ApiPropertyOptional({
    enum: PricingComboCalculationType,
    description: 'Che do tinh gia tu frontend: add hoac update',
    example: PricingComboCalculationType.ADD,
  })
  @IsEnum(PricingComboCalculationType)
  @IsOptional()
  type?: PricingComboCalculationType;

  @ApiPropertyOptional({
    description: 'Cart item ID khi frontend dang thao tac update cart',
    example: 12,
  })
  @IsInt()
  @IsOptional()
  cartItemId?: number;

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

  @ApiPropertyOptional({
    description: 'Slot index cua item dang tinh gia. Dung khi comboItemId co nhieu slot',
    example: 0,
  })
  @IsInt()
  @IsOptional()
  slotIndex?: number;

  @ApiPropertyOptional({
    type: [PricingIngredientOptionDto],
    description: 'Ingredients cua item dang tinh gia',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingIngredientOptionDto)
  @IsOptional()
  ingredients?: PricingIngredientOptionDto[];

  @ApiPropertyOptional({
    type: [PricingComboOptionDto],
    description: 'Snapshot comboOptions hien tai trong modal. API se cong tong surcharge cua tat ca item da change',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingComboOptionDto)
  @IsOptional()
  comboOptions?: PricingComboOptionDto[];
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
