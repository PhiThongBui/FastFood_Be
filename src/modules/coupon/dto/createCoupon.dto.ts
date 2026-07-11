import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min
} from 'class-validator';
import { COUPONTYPE } from '@/models/coupons.model';

export class CreateCouponDto {
    @ApiProperty({ example: 'WELCOME10' })
    @Type(() => String)
    @IsString({ message: 'Mã khuyến mãi phải là chuỗi' })
    @IsNotEmpty({ message: 'Mã khuyến mãi không được để trống' })
    code: string;

    @ApiProperty({ example: 'Giảm giá chào mừng' })
    @Type(() => String)
    @IsString({ message: 'Tên khuyến mãi phải là chuỗi' })
    @IsNotEmpty({ message: 'Tên khuyến mãi không được để trống' })
    name: string;

    @ApiPropertyOptional({ example: 'Giảm 10% cho đơn đầu tiên' })
    @IsOptional()
    @Type(() => String)
    @IsString({ message: 'Mô tả phải là chuỗi' })
    description?: string;

    @ApiProperty({ enum: COUPONTYPE, example: COUPONTYPE.PERCENT })
    @IsEnum(COUPONTYPE, { message: 'Loại coupon không hợp lệ' })
    type: COUPONTYPE;

    @ApiProperty({ example: 10, description: 'Nếu PERCENT thì nhập 1-100, FIXED thì nhập số tiền giảm' })
    @Type(() => Number)
    @IsInt({ message: 'Giá trị khuyến mãi phải là số nguyên' })
    @Min(1, { message: 'Giá trị khuyến mãi phải lớn hơn 0' })
    value: number;

    @ApiProperty({ example: 100000 })
    @Type(() => Number)
    @IsInt({ message: 'Giá trị tối thiểu đơn hàng phải là số nguyên' })
    @Min(0, { message: 'Giá trị tối thiểu đơn hàng không được âm' })
    minOrderValue: number;

    @ApiProperty({ example: 100 })
    @Type(() => Number)
    @IsInt({ message: 'Số lượng người dùng phải là số nguyên' })
    @Min(1, { message: 'Số lượng người dùng tối đa phải lớn hơn 0' })
    maxUser: number;

    @ApiProperty({ type: String, format: 'date-time' })
    @Type(() => Date)
    @IsDate({ message: 'Ngày bắt đầu không hợp lệ' })
    validFrom: Date;

    @ApiProperty({ type: String, format: 'date-time' })
    @Type(() => Date)
    @IsDate({ message: 'Ngày kết thúc không hợp lệ' })
    validTo: Date;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: 'isActive phải là true hoặc false' })
    isActive?: boolean;
}
