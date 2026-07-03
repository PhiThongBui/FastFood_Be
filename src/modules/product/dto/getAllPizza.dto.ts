import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

// ==================== QUERY DTO ====================
export class QueryGetAllPizzaDto {
    @ApiPropertyOptional({ description: 'Số trang', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Số lượng mỗi trang', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional({ description: 'Trường sắp xếp' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsString()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: string;
}

// ==================== RESPONSE DTO ====================

// // Variant DTO
// export class VariantPizzaDto {
//     @ApiProperty({ example: 1, description: 'ID variant' })
//     @Expose()
//     id: number;

//     @ApiProperty({ example: 'Nhỏ (20cm) Mỏng', description: 'Tên variant' })
//     @Expose()
//     name: string;

//     @ApiProperty({ example: '20cm', description: 'Kích thước' })
//     @Expose()
//     size: string;

//     @ApiProperty({ example: 'Mỏng', description: 'Loại bột' })
//     @Expose()
//     type: string;

//     @ApiProperty({ example: 10000, description: 'Giá điều chỉnh' })
//     @Expose()
//     modifiedPrice: number;
// }

// Product Pizza DTO (Main)
export class DataGetAllPizzaDto {
    @ApiProperty({ description: 'ID' })
    @Expose()
    id!: number;

    @ApiProperty({ description: 'Name' })
    @Expose()
    name!: string;

    @ApiProperty({ description: 'Slug' })
    @Expose()
    slug!: string;

    @ApiProperty({ description: 'Description' })
    @Expose()
    description!: string;

    @ApiProperty({ description: 'Image' })
    @Expose()
    imageUrl!: string;

    @ApiProperty({ description: 'Base price' })
    @Expose()
    basePrice!: number;

    @ApiProperty({ description: 'Is featured' })
    @Expose()
    isFeatured!: boolean;

    // @ApiProperty({ 
    //     type: [VariantPizzaDto], 
    //     description: 'Danh sách variant',
    //     required: false 
    // })
    // @Expose()
    // @Type(() => VariantPizzaDto)
    // variants?: VariantPizzaDto[];
}

// Pagination Meta DTO
export class PaginationMetaDto {
    @ApiProperty({ example: 50, description: 'Tổng số pizza' })
    @Expose()
    total!: number;

    @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại' })
    @Expose()
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ example: 10, description: 'Số item mỗi trang' })
    @Expose()
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional({ example: 5, description: 'Tổng số trang' })
    @Expose()
    @IsOptional()
    totalPages?: number;
}

// Final Response DTO
export class GetAllPizzaResponseDto {
    @ApiProperty({ 
        type: [DataGetAllPizzaDto], 
        description: 'Danh sách pizza' 
    })
    @Expose()
    @Type(() => DataGetAllPizzaDto)
    data!: DataGetAllPizzaDto[];

    @ApiProperty({ 
        type: PaginationMetaDto, 
        description: 'Thông tin phân trang' 
    })
    @Expose()
    @Type(() => PaginationMetaDto)
    meta!: PaginationMetaDto;
}
