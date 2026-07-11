import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ClaimCouponDto {
    @ApiProperty({ example: 1 })
    @Type(() => Number)
    @IsInt({ message: 'couponId phải là số nguyên' })
    @Min(1, { message: 'couponId phải lớn hơn 0' })
    couponId: number;
}
