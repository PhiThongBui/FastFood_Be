import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateStorePolicySettingDto {
    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    allowUserCancel?: boolean;

    @ApiPropertyOptional({ example: 15, nullable: true })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    cancelBeforeMinutes?: number | null;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    allowCancelPaidOrder?: boolean;

    @ApiPropertyOptional({ example: 'Go Pizza' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    storeName?: string | null;

    @ApiPropertyOptional({ example: '123 Nguyen Trai, Quan 1, TP.HCM' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    storeAddress?: string | null;

    @ApiPropertyOptional({ example: '0901234567' })
    @IsOptional()
    @IsString()
    @MaxLength(30)
    storePhone?: string | null;

    @ApiPropertyOptional({ example: 'support@gopizza.vn' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    storeEmail?: string | null;

    @ApiPropertyOptional({ example: '09:00 - 22:00 hang ngay' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    openingHours?: string | null;

    @ApiPropertyOptional({ example: 'Giao hàng trong bán kính hỗ trợ.' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    deliveryPolicy?: string | null;

    @ApiPropertyOptional({ example: 'Khách hàng có thể hủy khi đơn còn chờ xử lý.' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    cancellationPolicy?: string | null;

    @ApiPropertyOptional({ example: 'Thanh toán COD hoặc chuyển khoản qua SePay.' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    paymentPolicy?: string | null;

    @ApiPropertyOptional({ example: 'Liên hệ hotline để được hỗ trợ.' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    contactPolicy?: string | null;
}
