import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/createCoupon.dto';
import { CreateOutputCoupon } from './types/coupon.type';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '@/common/guards/role.guards';
import { Roles } from '@/common/decorators/roles.decorator';
import { ENUMROLE } from '@/models/user.model';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { GetUser } from '@/common/decorators/user.decorator';
import { ClaimCouponDto } from './dto/claim-coupon.dto';
import { QueryUserCouponDto } from './dto/query-user-coupon.dto';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('admin')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(ENUMROLE.ADMIN)
  @ApiBearerAuth('access-token')
  async createCoupon(@Body() createCouponDto: CreateCouponDto): Promise<CreateOutputCoupon> {
    return this.couponService.createCoupon(createCouponDto);
  }

  @Get('admin')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(ENUMROLE.ADMIN)
  @ApiBearerAuth('access-token')
  async findAllCoupons(@Query() query: QueryCouponDto) {
    return this.couponService.findAllCoupons(query);
  }

  @Get('admin/:id')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(ENUMROLE.ADMIN)
  @ApiBearerAuth('access-token')
  async findOneCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.findOneCoupon(id);
  }

  @Patch('admin/:id')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(ENUMROLE.ADMIN)
  @ApiBearerAuth('access-token')
  async updateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto
  ) {
    return this.couponService.updateCoupon(id, updateCouponDto);
  }

  @Patch('admin/:id/toggle')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(ENUMROLE.ADMIN)
  @ApiBearerAuth('access-token')
  async toggleCouponStatus(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.toggleCouponStatus(id);
  }

  @Delete('admin/:id')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(ENUMROLE.ADMIN)
  @ApiBearerAuth('access-token')
  async removeCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.removeCoupon(id);
  }

  @Get('available')
  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  async getAvailableCoupons(
    @GetUser('uid') userId: number,
    @Query() query: QueryUserCouponDto
  ) {
    return this.couponService.getAvailableCoupons(userId, query);
  }

  @Post('claim/:couponId')
  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  async claimCoupon(
    @GetUser('uid') userId: number,
    @Param('couponId', ParseIntPipe) couponId: number
  ) {
    return this.couponService.claimCoupon(userId, couponId);
  }

  @Post('save-coupon')
  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  async saveCoupon(
    @GetUser('uid') userId: number,
    @Body() saveCouponDto: ClaimCouponDto
  ) {
    return this.couponService.saveCoupon(userId, saveCouponDto.couponId);
  }

  @Get('my-coupons')
  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  async getMyCoupons(
    @GetUser('uid') userId: number,
    @Query() query: QueryUserCouponDto
  ) {
    return this.couponService.getMyCoupons(userId, query);
  }

  @Get('my-coupons/:couponId')
  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  async getMyCouponDetail(
    @GetUser('uid') userId: number,
    @Param('couponId', ParseIntPipe) couponId: number
  ) {
    return this.couponService.getMyCouponDetail(userId, couponId);
  }
}
