import { ApiProperty } from "@nestjs/swagger"
import { Exclude, Expose, Type } from "class-transformer"

export class VariantFeatruedDto {
    @ApiProperty({ example: 1 })
    @Expose()
    id: number

    @ApiProperty({ example: "Nhỏ (20cm) Mỏng" })
    @Expose()
    name: string

    @ApiProperty({ example: "15cm" })
    @Expose()
    size: string

    @ApiProperty({ example: "Mỏng" })
    @Expose()
    type: string

    @ApiProperty({ example: 10000 })
    @Expose()
    modifiedPrice: number

    @ApiProperty({ example: 189000 })
    @Expose()
    variantPrice: number
}
export class GetProductFeaturedDto {
    @ApiProperty({ example: 1 })
    @Expose()
    id: number

    @ApiProperty({ example: "Pizza Hải Sản Pesto" })
    @Expose()
    name: string

    @ApiProperty({ example: "pizza-hai-san-pesto" })
    @Expose()
    slug: string

    @ApiProperty({ example: 179000 })
    @Expose()
    basePrice: number

    @ApiProperty({ example: "Pizza với hải sản tươi ngon và sốt Pesto đặc biệt" })
    @Expose()
    description: string

    @ApiProperty({
        example:
            "https://media.dodostatic.com/image/r:292x292/11ef93517b036e5ca67b43ca2ba0ef12.avif"
    })
    @Expose()
    imageUrl: string

    @ApiProperty({ type: [VariantFeatruedDto] })
    @Expose()
    @Type(() => VariantFeatruedDto)
    variants: VariantFeatruedDto[]
}

