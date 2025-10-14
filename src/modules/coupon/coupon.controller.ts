import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/createCoupon.dto';
import { CreateOutputCoupon } from './types/coupon.type';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('create')
  async createCoupon(@Body() createCouponDto: CreateCouponDto): Promise<CreateOutputCoupon> {
    return this.couponService.createCoupon(createCouponDto);
  }

  @Post('save-coupon')
  @UseGuards(JWTGuard)
  async saveCoupon(@Body() saveCouponDto: { userId: number; couponId: number }): Promise<void> {
    return this.couponService.saveCoupon(saveCouponDto.userId, saveCouponDto.couponId);
  }
}
