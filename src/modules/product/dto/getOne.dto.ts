import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class ProductVariantDto {
    @Expose()
    @ApiProperty({ example: 'Pizza cỡ nhỏ' })
    name: string;

    @Expose()
    @ApiProperty({ example: '15cm' })
    size: string;

    @Expose()
    @ApiProperty({ example: 'Mỏng' })
    type: string;

    @Expose()
    @ApiProperty({ example: 5000 })
    modifiedPrice: number;

    @Expose()
    @ApiProperty({ example: 25000 })
    variantPrice: number;
}

class IngredientInnerDto {
    @Expose() name: string;
    @Expose() description: string;
    @Expose() imageUrl: string;
    @Expose() price: number;
}

class IngredientDto {
    @Expose() isDefault: boolean;
    @Expose() quantity: number;

    @Expose()
    @Type(() => IngredientInnerDto)
    ingredient: IngredientInnerDto;

}

class CategoryDto {
    @Expose()
    @ApiProperty({ example: 'Pizza' })
    name: string;

    @Expose()
    @ApiProperty({ example: 'pizza' })
    slug: string;
}

export class ResponseProductDetailDto {
    @Expose()
    @ApiProperty({ example: 'Pizza Hải sản' })
    name: string;

    @Expose()
    @ApiProperty({ example: 'pizza-hai-san' })
    slug: string;

    @Expose()
    @ApiProperty({ example: 'Pizza hải sản tươi ngon' })
    description: string;

    @Expose()
    @ApiProperty({ example: 120000 })
    basePrice: number;

    @Expose()
    @ApiProperty({ example: 'https://example.com/pizza.jpg' })
    imageUrl: string;

    @Expose()
    @Type(() => CategoryDto)
    @ApiProperty({ type: () => CategoryDto })
    category: CategoryDto;

    @Expose()
    @Type(() => ProductVariantDto)
    @ApiProperty({ type: [ProductVariantDto] })
    variants: ProductVariantDto[];

    @Expose()
    @Type(() => IngredientDto)
    @ApiProperty({ type: [IngredientDto] })
    ingredients: IngredientDto[];
}
