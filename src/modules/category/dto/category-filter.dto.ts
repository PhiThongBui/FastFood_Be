import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum CategorySortBy {
    ID = 'id',
    NAME = 'name',
    SORT_ORDER = 'sortOrder',
    CREATED_AT = 'createdAt'
}

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC'
}

export class CategoryFilterDto {
    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({ description: 'Search term for name or description' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: CategorySortBy, default: CategorySortBy.SORT_ORDER })
    @IsOptional()
    @IsEnum(CategorySortBy)
    sortBy?: CategorySortBy;

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder;

    @ApiPropertyOptional({ description: 'Filter by active status (true/false)' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}
