import { Expose, Type } from 'class-transformer';

// DTO cho Ingredient
export class IngredientDto {
  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  imageUrl: string;

  @Expose()
  price: number;
}

// DTO cho ProductIngredient (nested trong Product)
export class ProductIngredientDto {
  @Expose()
  id: number;

  @Expose()
  isDefault: boolean;

  @Expose()
  quantity: number;

  @Expose()
  @Type(() => IngredientDto)
  ingredient: IngredientDto;
}

// DTO cho ProductVariant
export class ProductVariantDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  size: string;

  @Expose()
  type: string;

  @Expose()
  modifiedPrice: number;

  @Expose()
  isComboItem: boolean;
}

// DTO cho Product (nested trong ComboItem)
export class ProductDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  basePrice: number;

  @Expose()
  description: string;

  @Expose()
  imageUrl: string;

  @Expose()
  @Type(() => ProductIngredientDto)
  ingredients: ProductIngredientDto[];
}

// DTO cho ComboItem
export class ComboItemDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => ProductDto)
  product: ProductDto;

  @Expose()
  @Type(() => ProductVariantDto)
  productVariant: ProductVariantDto;
}

// DTO chính cho Combo Response
export class ComboDetailDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  description: string;

  @Expose()
  price: number;

  @Expose()
  imageUrl: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => ComboItemDto)
  items: ComboItemDto[];
}
