import { ArrayNotRequired, BooleanNotRequired, EnumRequired, NumberRequired, StringNotRequired, StringRequired } from "@/common/decorators"
import { PRODUCTVARIANTSIZE, PRODUCTVARIANTTYPE } from "@/models"

export class CreateProductIngredientDto {

    @NumberRequired('Ingredient Ids', 1)
    ingredientId!: number

    @BooleanNotRequired
    isDefault!: boolean

    @NumberRequired('Số lượng ingredient')
    quantity!: number
}
export class CreateProductVariantDto {
    @StringRequired('Tên sản phẩm biến thể')
    name!: string

    @EnumRequired('Kiểu biến thể: DEFAULT, Mỏng, Bình thường', PRODUCTVARIANTTYPE)
    type!: PRODUCTVARIANTTYPE

    @EnumRequired('Size của biến thể là DEFAULT, 15cm, 20cm, 25cm', PRODUCTVARIANTSIZE)
    size!: PRODUCTVARIANTSIZE

    @NumberRequired('Giá điều chỉnh')
    modifiedPrice!: number

}

export class CreateProductDto {
    @StringRequired('Tên sản phẩm')
    name!: string

    @NumberRequired('Giá gốc sản phẩm')
    basePrice!: number

    @StringNotRequired
    description!: string

    @StringRequired('Ảnh sản phẩm')
    imageUrl!: string

    @BooleanNotRequired
    isFeatured!: boolean

    @NumberRequired('Danh mục của sản phẩm', 1)
    categoryId!: number

    @ArrayNotRequired(CreateProductVariantDto)
    productVariants!: CreateProductVariantDto[]

    @ArrayNotRequired(CreateProductIngredientDto)
    productIngredients!: CreateProductIngredientDto[]
}



