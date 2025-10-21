import { Coupons, User, UserCoupons } from '@/models';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateCouponDto } from './dto/createCoupon.dto';
import { CreateOutputCoupon, ValidateCoupon } from './types/coupon.type';
import { CreationAttributes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UserService } from '../user/user.service';
import { COUPONTYPE } from '@/models/coupons.model';

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
        try {
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

            await transaction.commit();
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
        } catch (error) {
            await transaction.rollback(); 
            throw new BadRequestException(error.message);
        }
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

    async validateCoupon(userId: number, couponCode: string, subTotal: number, transaction: any): Promise<ValidateCoupon> {
        const coupon = await this.modelCoupon.findOne({
            where: {
                code: couponCode
            },
            transaction: transaction
        })

        if (!coupon) {
            throw new BadRequestException('Coupon not found');
        }

        const useCoupon = await this.modelUserCoupon.findOne({
            where: {
                userId: userId,
                couponId: coupon.dataValues.id,
                isUsed: true
            },
            transaction: transaction
        })

        if (useCoupon) {
            throw new BadRequestException('Coupon already used');
        }

        const now = new Date();
        if (now < coupon.dataValues.validFrom || now > coupon.dataValues.validTo) {
            throw new BadRequestException('Coupon expired');
        }

        if (subTotal < coupon.dataValues.minOrderAmount) {
            throw new BadRequestException(`Đơn hàng phải đạt tối thiểu ${coupon.dataValues.minOrderAmount.toLocaleString('vi-VN')} VNĐ để sử dụng coupon này.`);
        }

        if (coupon.dataValues.currentUsers >= coupon.dataValues.maxUsers) {
            throw new BadRequestException('Coupon has been ecched out');
        }

        let discount = 0

        if (coupon.dataValues.type === COUPONTYPE.FIXED) {
            discount = coupon.dataValues.value
        } else if (coupon.dataValues.type === COUPONTYPE.PERCENT) {
            discount = subTotal * (coupon.dataValues.value / 100)
        }

        return {
            message: 'Coupon is valid',
            discount: discount,
            couponInfo: {
                code: coupon.dataValues.code,
                type: coupon.dataValues.type,
                value: coupon.dataValues.value
            }
        }
    }
}
