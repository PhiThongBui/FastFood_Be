import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { COUPONTYPE } from '@/models/coupons.model';

export class QueryCouponDto {
    @ApiPropertyOptional({ example: 'welcome' })
    @IsOptional()
    @Type(() => String)
    @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
    keyword?: string;

    @ApiPropertyOptional({ enum: COUPONTYPE, example: COUPONTYPE.PERCENT })
    @IsOptional()
    @IsEnum(COUPONTYPE, { message: 'Loại coupon không hợp lệ' })
    type?: COUPONTYPE;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: 'isActive phải là true hoặc false' })
    isActive?: boolean;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'validFrom không hợp lệ' })
    validFrom?: Date;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'validTo không hợp lệ' })
    validTo?: Date;

    @ApiPropertyOptional({ example: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'page phải là số nguyên' })
    @Min(1, { message: 'page phải lớn hơn 0' })
    page?: number;

    @ApiPropertyOptional({ example: 10, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'limit phải là số nguyên' })
    @Min(1, { message: 'limit phải lớn hơn 0' })
    limit?: number;

    @ApiPropertyOptional({ enum: ['code', 'name', 'type', 'value', 'minOrderAmount', 'maxUsers', 'currentUsers', 'validFrom', 'validTo', 'createdAt'] })
    @IsOptional()
    @Type(() => String)
    @IsIn(['code', 'name', 'type', 'value', 'minOrderAmount', 'maxUsers', 'currentUsers', 'validFrom', 'validTo', 'createdAt'], {
        message: 'sortBy không hợp lệ'
    })
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
    @IsOptional()
    @Type(() => String)
    @IsIn(['ASC', 'DESC'], { message: 'sortOrder phải là ASC hoặc DESC' })
    sortOrder?: 'ASC' | 'DESC';
}
