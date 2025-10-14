import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Coupons, User, UserCoupons } from '@/models';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [CouponController],
  providers: [CouponService],
  imports:[SequelizeModule.forFeature([Coupons,User,UserCoupons]), UserModule],
})
export class CouponModule {}
