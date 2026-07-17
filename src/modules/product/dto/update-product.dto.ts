import { ArrayNotRequired, BooleanNotRequired, EnumNotRequired, NumberNotRequired, StringNotRequired } from "@/common/decorators";
import { PRODUCTVARIANTSIZE, PRODUCTVARIANTTYPE } from "@/models";

export class UpdateProductVariantDto {
    @NumberNotRequired
    id?: number

    @StringNotRequired
    name?: string

    @EnumNotRequired(PRODUCTVARIANTTYPE)
    type?: PRODUCTVARIANTTYPE

    @EnumNotRequired(PRODUCTVARIANTSIZE)
    size?: PRODUCTVARIANTSIZE

    @NumberNotRequired
    modifiedPrice?: number

    @BooleanNotRequired
    isActive?: boolean
}

export class UpdateProductIngredientDto {
    @NumberNotRequired
    id?: number

    @NumberNotRequired
    ingredientId?: number

    @BooleanNotRequired
    isDefault?: boolean

    @NumberNotRequired
    quantity?: number
}

// Không extends, định nghĩa lại hoàn toàn
export class UpdateProductDto {
    @StringNotRequired
    name?: string

    @NumberNotRequired
    basePrice?: number

    @StringNotRequired
    description?: string
    
    @StringNotRequired
    imageUrl?: string

    @BooleanNotRequired
    isFeatured?: boolean

    @NumberNotRequired
    categoryId?: number

    @BooleanNotRequired
    isActive?: boolean

    @ArrayNotRequired(UpdateProductVariantDto)
    productVariants?: UpdateProductVariantDto[]

    @ArrayNotRequired(UpdateProductIngredientDto)
    productIngredients?: UpdateProductIngredientDto[]
}
