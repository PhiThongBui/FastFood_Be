import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { COUPONTYPE } from '@/models/coupons.model';
import { USER_COUPON_STATUS } from '../types/coupon.type';

export class QueryUserCouponDto {
    @ApiPropertyOptional({ example: 'welcome' })
    @IsOptional()
    @Type(() => String)
    @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
    keyword?: string;

    @ApiPropertyOptional({ enum: COUPONTYPE, example: COUPONTYPE.PERCENT })
    @IsOptional()
    @IsEnum(COUPONTYPE, { message: 'Loại coupon không hợp lệ' })
    type?: COUPONTYPE;

    @ApiPropertyOptional({ enum: USER_COUPON_STATUS, example: USER_COUPON_STATUS.ALL })
    @IsOptional()
    @IsEnum(USER_COUPON_STATUS, { message: 'Trạng thái coupon không hợp lệ' })
    status?: USER_COUPON_STATUS;

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
}
