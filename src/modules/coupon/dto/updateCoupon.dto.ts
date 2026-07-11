import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './createCoupon.dto';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
