import { Coupons, User, UserCoupons } from '@/models';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateCouponDto } from './dto/createCoupon.dto';
import { CreateOutputCoupon } from './types/coupon.type';
import { CreationAttributes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UserService } from '../user/user.service';

@Injectable()
export class CouponService {
    constructor(
        @InjectModel(Coupons) private readonly modelCoupon: typeof Coupons,
        @InjectModel(User) private readonly modelUser: typeof User,
        @InjectModel(UserCoupons) private readonly modelUserCoupon: typeof UserCoupons,
        private readonly userService: UserService,
        private readonly sequelize: Sequelize
    ) { }

    async createCoupon(createCouponDto: CreateCouponDto): Promise<CreateOutputCoupon> {
        const transaction = await this.sequelize.transaction();
        const mappedData: CreationAttributes<Coupons> = {
            code: createCouponDto.code,
            name: createCouponDto.name,
            description: createCouponDto.description,
            type: createCouponDto.type,
            value: createCouponDto.value,
            minOrderAmount: createCouponDto.minOrderValue,
            maxUsers: createCouponDto.maxUser,
            validFrom: createCouponDto.validFrom,
            validTo: createCouponDto.validTo,
            isActive: true,
            currentUsers: 0,
        } as CreationAttributes<Coupons>;

        const newCoupon = await this.modelCoupon.create(mappedData, { transaction });

        return {
            message: 'Create Coupon Successfully!',
            data: {
                code: newCoupon.dataValues.code,
                name: newCoupon.dataValues.name,
                description: newCoupon.dataValues.description,
                type: newCoupon.dataValues.type,
                value: newCoupon.dataValues.value,
                minOrderValue: newCoupon.dataValues.minOrderAmount,
                maxUser: newCoupon.dataValues.maxUsers,
                validFrom: newCoupon.dataValues.validFrom,
                validTo: newCoupon.dataValues.validTo,
            },
        };
    }

    async saveCoupon(userId: number, couponId: number): Promise<void> {
        if (!userId) {
            throw new BadRequestException('User id not found');
        }

        const existedCoupon = await this.modelUserCoupon.findOne({
            where: {
                userId: userId,
                couponId: couponId
            }
        })
        if (existedCoupon) {
            throw new BadRequestException('Coupon already exist');
        }

        await this.modelUserCoupon.create({
            userId: userId,
            couponId: couponId,
        } as UserCoupons)
    }

}
