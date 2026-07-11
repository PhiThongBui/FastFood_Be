import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Coupons, User, UserCoupons } from '@/models';
import { UserModule } from '../user/user.module';
import { RolesGuard } from '@/common/guards/role.guards';

@Module({
  controllers: [CouponController],
  providers: [CouponService, RolesGuard],
  imports: [SequelizeModule.forFeature([Coupons, User, UserCoupons]), UserModule],
  exports: [CouponService]
})
export class CouponModule {}
