import { ApiProperty } from "@nestjs/swagger"
import { Expose, Type } from "class-transformer"

export class VariantBestSellerDto {
    @ApiProperty({ example: 1 })
    @Expose()
    id!: number

    @ApiProperty({ example: "Nhỏ (20cm) Mỏng" })
    @Expose()
    name!: string

    @ApiProperty({ example: "15cm" })
    @Expose()
    size!: string

    @ApiProperty({ example: "Mỏng" })
    @Expose()
    type!: string

    @ApiProperty({ example: 10000 })
    @Expose()
    modifiedPrice!: number

    @ApiProperty({ example: 189000 })
    @Expose()
    variantPrice!: number
}

export class ProductBestSellerDto {
    @ApiProperty({ example: 1 })
    @Expose()
    id!: number

    @ApiProperty({ example: "Pizza Hải Sản Pesto" })
    @Expose()
    name!: string

    @ApiProperty({ example: "pizza-hai-san-pesto" })
    @Expose()
    slug!: string

    @ApiProperty({ example: 179000 })
    @Expose()
    basePrice!: number

    @ApiProperty({ example: "Pizza với hải sản tươi ngon và sốt Pesto đặc biệt" })
    @Expose()
    description!: string

    @ApiProperty({
        example:
            "https://media.dodostatic.com/image/r:292x292/11ef93517b036e5ca67b43ca2ba0ef12.avif"
    })
    @Expose()
    imageUrl!: string
}

export class BestSellerProductDto {
    
    @ApiProperty({ type: ProductBestSellerDto })
    @Expose()
    @Type(() => ProductBestSellerDto)
    product!: ProductBestSellerDto

    @ApiProperty({ type: [VariantBestSellerDto] })
    @Expose()
    @Type(() => VariantBestSellerDto)
    variants!: VariantBestSellerDto[]
}

export class BestSellerComboDto {
    @ApiProperty({ example: 1 })
    @Expose()
    id!: number

    @ApiProperty({ example: "Pizza Hải Sản Pesto" })
    @Expose()
    name!: string

    @ApiProperty({ example: "Pizza với hải sản tươi ngon và sốt Pesto đặc biệt" })
    @Expose()
    description!: string

    @ApiProperty({ example: "pizza-hai-san-pesto" })
    @Expose()
    slug!: string

    @ApiProperty({
        example:
            "https://media.dodostatic.com/image/r:292x292/11ef93517b036e5ca67b43ca2ba0ef12.avif"
    })
    @Expose()
    imageUrl!: string

    @ApiProperty({ example: true })
    @Expose()
    isFeatured!: boolean;

    @ApiProperty({ example: 179000 })
    @Expose()
    price!: number

    @ApiProperty({ type: [BestSellerProductDto] })
    @Expose()
    @Type(() => BestSellerProductDto)
    product!: BestSellerProductDto[]

    
}

export class BestSellerDto {
    @ApiProperty({ type: [BestSellerComboDto] })
    @Expose()
    @Type(() => BestSellerComboDto)
    combo!: BestSellerComboDto[]

    @ApiProperty({ type: [BestSellerProductDto] })
    @Expose()
    @Type(() => BestSellerProductDto)
    product!: BestSellerProductDto[]
}


