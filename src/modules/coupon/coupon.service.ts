import { Coupons, UserCoupons } from '@/models';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateCouponDto } from './dto/createCoupon.dto';
import { CreateOutputCoupon, USER_COUPON_STATUS, UserCouponItem, ValidateCoupon } from './types/coupon.type';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COUPONTYPE } from '@/models/coupons.model';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { QueryUserCouponDto } from './dto/query-user-coupon.dto';

type CouponOutputData = CreateOutputCoupon['data'];
type CouponLifecycleStatus = Exclude<USER_COUPON_STATUS, USER_COUPON_STATUS.ALL | USER_COUPON_STATUS.USED>;

@Injectable()
export class CouponService {
    constructor(
        @InjectModel(Coupons) private readonly modelCoupon: typeof Coupons,
        @InjectModel(UserCoupons) private readonly modelUserCoupon: typeof UserCoupons,
        private readonly sequelize: Sequelize
    ) { }

    async createCoupon(createCouponDto: CreateCouponDto): Promise<CreateOutputCoupon> {
        const transaction = await this.sequelize.transaction();

        try {
            const normalizedCode = this.normalizeCouponCode(createCouponDto.code);
            await this.ensureCouponCodeAvailable(normalizedCode, transaction);

            const validFrom = this.toValidDate(createCouponDto.validFrom, 'validFrom');
            const validTo = this.toValidDate(createCouponDto.validTo, 'validTo');

            this.validateCouponBusinessRules({
                type: createCouponDto.type,
                value: Number(createCouponDto.value),
                minOrderValue: Number(createCouponDto.minOrderValue),
                maxUser: Number(createCouponDto.maxUser),
                validFrom,
                validTo
            });

            const mappedData: CreationAttributes<Coupons> = {
                code: normalizedCode,
                name: createCouponDto.name.trim(),
                description: createCouponDto.description?.trim() || null,
                type: createCouponDto.type,
                value: Number(createCouponDto.value),
                minOrderAmount: Number(createCouponDto.minOrderValue),
                maxUsers: Number(createCouponDto.maxUser),
                validFrom,
                validTo,
                isActive: createCouponDto.isActive ?? true,
                currentUsers: 0,
            } as CreationAttributes<Coupons>;

            const newCoupon = await this.modelCoupon.create(mappedData, { transaction });

            await transaction.commit();

            return {
                message: 'Create coupon successfully!',
                data: this.mapCouponData(newCoupon),
            };
        } catch (error: unknown) {
            await transaction.rollback();
            throw new BadRequestException(this.getErrorMessage(error));
        }
    }

    async findAllCoupons(query: QueryCouponDto) {
        const page = Number(query.page || 1);
        const limit = Number(query.limit || 10);
        const offset = (page - 1) * limit;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = (query.sortOrder || 'DESC').toUpperCase() as 'ASC' | 'DESC';
        const whereClause: {
            [key: string]: unknown;
            [Op.or]?: Array<Record<string, unknown>>;
        } = {};

        if (query.keyword?.trim()) {
            const keyword = query.keyword.trim();

            whereClause[Op.or] = [
                { code: { [Op.iLike]: `%${keyword}%` } },
                { name: { [Op.iLike]: `%${keyword}%` } },
                { description: { [Op.iLike]: `%${keyword}%` } },
            ];
        }

        if (query.type) {
            whereClause.type = query.type;
        }

        if (typeof query.isActive === 'boolean') {
            whereClause.isActive = query.isActive;
        }

        if (query.validFrom) {
            whereClause.validFrom = {
                [Op.gte]: this.toValidDate(query.validFrom, 'validFrom')
            };
        }

        if (query.validTo) {
            whereClause.validTo = {
                [Op.lte]: this.toValidDate(query.validTo, 'validTo')
            };
        }

        const couponResult = await this.modelCoupon.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [[sortBy, sortOrder]],
        });

        return {
            message: 'Get coupon list successfully!',
            data: couponResult.rows.map(coupon => this.mapCouponData(coupon)),
            meta: {
                total: couponResult.count,
                page,
                limit,
                totalPages: Math.ceil(couponResult.count / limit),
            }
        };
    }

    async findOneCoupon(id: number) {
        const coupon = await this.findCouponById(id);

        return {
            message: 'Get coupon successfully!',
            data: this.mapCouponData(coupon),
        };
    }

    async updateCoupon(id: number, updateCouponDto: UpdateCouponDto) {
        const coupon = await this.findCouponById(id);
        const payload: Record<string, string | number | boolean | Date | null> = {};

        const nextType = updateCouponDto.type ?? coupon.dataValues.type;
        const nextValue = updateCouponDto.value ?? coupon.dataValues.value;
        const nextMinOrderValue = updateCouponDto.minOrderValue ?? coupon.dataValues.minOrderAmount;
        const nextMaxUser = updateCouponDto.maxUser ?? coupon.dataValues.maxUsers;
        const nextValidFrom = updateCouponDto.validFrom
            ? this.toValidDate(updateCouponDto.validFrom, 'validFrom')
            : coupon.dataValues.validFrom;
        const nextValidTo = updateCouponDto.validTo
            ? this.toValidDate(updateCouponDto.validTo, 'validTo')
            : coupon.dataValues.validTo;

        this.validateCouponBusinessRules({
            type: nextType,
            value: Number(nextValue),
            minOrderValue: Number(nextMinOrderValue),
            maxUser: Number(nextMaxUser),
            validFrom: nextValidFrom,
            validTo: nextValidTo
        }, Number(coupon.dataValues.currentUsers || 0));

        if (updateCouponDto.code !== undefined) {
            const normalizedCode = this.normalizeCouponCode(updateCouponDto.code);
            await this.ensureCouponCodeAvailable(normalizedCode, undefined, id);
            payload.code = normalizedCode;
        }

        if (updateCouponDto.name !== undefined) {
            payload.name = updateCouponDto.name.trim();
        }

        if (updateCouponDto.description !== undefined) {
            payload.description = updateCouponDto.description?.trim() || null;
        }

        if (updateCouponDto.type !== undefined) {
            payload.type = updateCouponDto.type;
        }

        if (updateCouponDto.value !== undefined) {
            payload.value = Number(updateCouponDto.value);
        }

        if (updateCouponDto.minOrderValue !== undefined) {
            payload.minOrderAmount = Number(updateCouponDto.minOrderValue);
        }

        if (updateCouponDto.maxUser !== undefined) {
            payload.maxUsers = Number(updateCouponDto.maxUser);
        }

        if (updateCouponDto.validFrom !== undefined) {
            payload.validFrom = nextValidFrom;
        }

        if (updateCouponDto.validTo !== undefined) {
            payload.validTo = nextValidTo;
        }

        if (updateCouponDto.isActive !== undefined) {
            payload.isActive = updateCouponDto.isActive;
        }

        await coupon.update(payload);

        return {
            message: 'Update coupon successfully!',
            data: this.mapCouponData(coupon),
        };
    }

    async toggleCouponStatus(id: number) {
        const coupon = await this.findCouponById(id);

        await coupon.update({
            isActive: !coupon.dataValues.isActive
        });

        return {
            message: `Coupon has been ${coupon.dataValues.isActive ? 'activated' : 'deactivated'} successfully!`,
            data: this.mapCouponData(coupon),
        };
    }

    async removeCoupon(id: number) {
        const coupon = await this.findCouponById(id);

        await coupon.update({ isActive: false });

        return {
            message: 'Coupon deleted successfully!',
            data: this.mapCouponData(coupon),
        };
    }

    async getAvailableCoupons(userId: number | null | undefined, query: QueryUserCouponDto) {
        if (userId) {
            this.ensureUserId(userId);
        }

        const coupons = await this.modelCoupon.findAll({
            where: this.buildUserCouponWhereClause(query),
            order: [['createdAt', 'DESC']],
        });

        const couponIds = coupons.map(coupon => Number(coupon.dataValues.id));
        const userCoupons = (userId && couponIds.length)
            ? await this.modelUserCoupon.findAll({
                where: {
                    userId,
                    couponId: {
                        [Op.in]: couponIds
                    }
                }
            })
            : [];

        const userCouponMap = new Map(
            userCoupons.map(userCoupon => [Number(userCoupon.dataValues.couponId), userCoupon])
        );

        const mappedData = coupons
            .map(coupon => this.mapUserCouponItem(coupon, userCouponMap.get(Number(coupon.dataValues.id)) || null))
            .filter(item => this.matchesUserCouponStatus(item, query.status));

        return this.buildPaginatedUserCouponResponse('Get available coupons successfully!', mappedData, query);
    }

    async claimCoupon(userId: number, couponId: number) {
        this.ensureUserId(userId);

        const transaction = await this.sequelize.transaction();

        try {
            const coupon = await this.modelCoupon.findOne({
                where: { id: couponId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!coupon) {
                throw new NotFoundException('Coupon not found');
            }

            const lifecycleStatus = this.getCouponLifecycleStatus(coupon);
            if (lifecycleStatus !== USER_COUPON_STATUS.AVAILABLE) {
                throw new BadRequestException(this.getClaimErrorMessage(lifecycleStatus));
            }

            const existedCoupon = await this.modelUserCoupon.findOne({
                where: {
                    userId,
                    couponId
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (existedCoupon) {
                throw new BadRequestException('Coupon already claimed');
            }

            const claimedCoupon = await this.modelUserCoupon.create({
                userId,
                couponId,
                claimedAt: new Date(),
                isUsed: false,
                usedAt: null
            } as UserCoupons, { transaction });

            await coupon.update({
                currentUsers: Number(coupon.dataValues.currentUsers || 0) + 1
            }, { transaction });

            const claimedCouponDetail = await this.modelUserCoupon.findOne({
                where: { id: claimedCoupon.dataValues.id },
                include: [{ model: Coupons, required: true }],
                transaction
            });

            if (!claimedCouponDetail) {
                throw new NotFoundException('Claimed coupon not found');
            }

            await transaction.commit();

            return {
                message: 'Claim coupon successfully!',
                data: await this.getMyCouponItemByCouponId(userId, couponId, claimedCouponDetail)
            };
        } catch (error: unknown) {
            if (!(transaction as Transaction & { finished?: string }).finished) {
                await transaction.rollback();
            }
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(this.getErrorMessage(error));
        }
    }

    async getMyCoupons(userId: number, query: QueryUserCouponDto) {
        this.ensureUserId(userId);

        const userCoupons = await this.modelUserCoupon.findAll({
            where: { userId },
            include: [
                {
                    model: Coupons,
                    where: this.buildUserCouponWhereClause(query),
                    required: true,
                }
            ],
            order: [['claimedAt', 'DESC'], ['createdAt', 'DESC']],
        });

        const mappedItems = await Promise.all(
            userCoupons.map(async (userCoupon) => {
                try {
                    return await this.getMyCouponItemByCouponId(
                        userId,
                        Number(userCoupon.dataValues.couponId),
                        userCoupon
                    );
                } catch (error: unknown) {
                    if (error instanceof NotFoundException) {
                        return null;
                    }

                    throw error;
                }
            })
        );

        const availableItems = mappedItems.filter((item): item is UserCouponItem => item !== null);
        const mappedData = availableItems.filter(item => this.matchesUserCouponStatus(item, query.status));

        return this.buildPaginatedUserCouponResponse('Get my coupons successfully!', mappedData, query);
    }

    async getMyCouponDetail(userId: number, couponId: number) {
        this.ensureUserId(userId);

        const userCoupon = await this.modelUserCoupon.findOne({
            where: { userId, couponId },
            include: [{ model: Coupons, required: true }]
        });

        if (!userCoupon) {
            throw new NotFoundException('Claimed coupon not found');
        }

        return {
            message: 'Get my coupon successfully!',
            data: await this.getMyCouponItemByCouponId(userId, couponId, userCoupon)
        };
    }

    async saveCoupon(userId: number, couponId: number) {
        return this.claimCoupon(userId, couponId);
    }

    async validateCoupon(userId: number, couponCode: string, subTotal: number): Promise<ValidateCoupon> {
        this.ensureUserId(userId);

        const coupon = await this.modelCoupon.findOne({
            where: {
                code: this.normalizeCouponCode(couponCode)
            },
        });

        if (!coupon) {
            throw new BadRequestException('Coupon not found');
        }

        const userCoupon = await this.modelUserCoupon.findOne({
            where: {
                userId,
                couponId: Number(coupon.dataValues.id),
            },
        });

        if (!userCoupon) {
            throw new BadRequestException('Coupon has not been claimed');
        }

        if (userCoupon.dataValues.isUsed) {
            throw new BadRequestException('Coupon already used');
        }

        const lifecycleStatus = this.getCouponLifecycleStatus(coupon);
        if (lifecycleStatus !== USER_COUPON_STATUS.AVAILABLE) {
            throw new BadRequestException(this.getValidateErrorMessage(lifecycleStatus));
        }

        if (subTotal < coupon.dataValues.minOrderAmount) {
            throw new BadRequestException(`Đơn hàng phải đạt tối thiểu ${coupon.dataValues.minOrderAmount.toLocaleString('vi-VN')} VNĐ để sử dụng coupon này.`);
        }

        let discount = 0;

        if (coupon.dataValues.type === COUPONTYPE.FIXED) {
            discount = coupon.dataValues.value;
        } else if (coupon.dataValues.type === COUPONTYPE.PERCENT) {
            discount = Math.floor(subTotal * (coupon.dataValues.value / 100));
        }

        discount = Math.min(discount, subTotal);

        return {
            message: 'Coupon is valid',
            discount,
            couponInfo: {
                code: coupon.dataValues.code,
                type: coupon.dataValues.type,
                value: coupon.dataValues.value
            }
        };
    }

    async markCouponUsed(userId: number, couponCode: string, transaction?: Transaction): Promise<void> {
        this.ensureUserId(userId);

        const coupon = await this.modelCoupon.findOne({
            where: { code: this.normalizeCouponCode(couponCode) },
            transaction,
            lock: transaction?.LOCK.UPDATE
        });

        if (!coupon) {
            throw new BadRequestException('Coupon not found');
        }

        const lifecycleStatus = this.getCouponLifecycleStatus(coupon);
        if (lifecycleStatus !== USER_COUPON_STATUS.AVAILABLE) {
            throw new BadRequestException(this.getValidateErrorMessage(lifecycleStatus));
        }

        const userCoupon = await this.modelUserCoupon.findOne({
            where: {
                userId,
                couponId: Number(coupon.dataValues.id)
            },
            transaction,
            lock: transaction?.LOCK.UPDATE
        });

        if (!userCoupon) {
            throw new BadRequestException('Coupon has not been claimed');
        }

        if (userCoupon.dataValues.isUsed) {
            throw new BadRequestException('Coupon already used');
        }

        await userCoupon.update({
            isUsed: true,
            usedAt: new Date()
        }, { transaction });
    }

    private async getMyCouponItemByCouponId(userId: number, couponId: number, userCoupon?: UserCoupons): Promise<UserCouponItem> {
        const claimedCoupon = userCoupon ?? await this.modelUserCoupon.findOne({
            where: { userId, couponId },
            include: [{ model: Coupons, required: true }]
        });

        if (!claimedCoupon) {
            throw new NotFoundException('Claimed coupon not found');
        }

        const attachedCoupon = claimedCoupon.coupon ?? await this.modelCoupon.findByPk(
            Number(claimedCoupon.dataValues.couponId || couponId)
        );

        if (!attachedCoupon) {
            throw new NotFoundException('Coupon not found');
        }

        claimedCoupon.coupon = attachedCoupon;

        return this.mapClaimedCouponItem(claimedCoupon);
    }

    private buildUserCouponWhereClause(query: QueryUserCouponDto): Record<string, unknown> {
        const whereClause: {
            [key: string]: unknown;
            [Op.or]?: Array<Record<string, unknown>>;
        } = {};

        if (query.keyword?.trim()) {
            const keyword = query.keyword.trim();
            whereClause[Op.or] = [
                { code: { [Op.iLike]: `%${keyword}%` } },
                { name: { [Op.iLike]: `%${keyword}%` } },
                { description: { [Op.iLike]: `%${keyword}%` } },
            ];
        }

        if (query.type) {
            whereClause.type = query.type;
        }

        return whereClause;
    }

    private buildPaginatedUserCouponResponse(message: string, items: UserCouponItem[], query: QueryUserCouponDto) {
        const page = Number(query.page || 1);
        const limit = Number(query.limit || 10);
        const offset = (page - 1) * limit;
        const paginatedItems = items.slice(offset, offset + limit);

        return {
            message,
            data: paginatedItems,
            meta: {
                total: items.length,
                page,
                limit,
                totalPages: Math.ceil(items.length / limit),
            }
        };
    }

    private matchesUserCouponStatus(item: UserCouponItem, status?: USER_COUPON_STATUS): boolean {
        if (!status || status === USER_COUPON_STATUS.ALL) {
            return true;
        }

        return item.status === status;
    }

    private mapUserCouponItem(coupon: Coupons, matchedUserCoupon: UserCoupons | null): UserCouponItem {
        const couponData = coupon.dataValues;
        const lifecycleStatus = this.getCouponLifecycleStatus(coupon);
        const claimedAt = matchedUserCoupon?.dataValues.claimedAt ?? null;
        const usedAt = matchedUserCoupon?.dataValues.usedAt ?? null;
        const isUsed = Boolean(matchedUserCoupon?.dataValues.isUsed);

        return {
            userCouponId: matchedUserCoupon ? Number(matchedUserCoupon.dataValues.id) : null,
            couponId: Number(couponData.id),
            code: couponData.code,
            name: couponData.name,
            description: couponData.description || null,
            type: couponData.type,
            value: Number(couponData.value),
            minOrderValue: Number(couponData.minOrderAmount),
            maxUser: Number(couponData.maxUsers),
            currentUsers: Number(couponData.currentUsers || 0),
            remainingQuantity: Math.max(Number(couponData.maxUsers) - Number(couponData.currentUsers || 0), 0),
            validFrom: couponData.validFrom,
            validTo: couponData.validTo,
            isActive: Boolean(couponData.isActive),
            status: isUsed ? USER_COUPON_STATUS.USED : lifecycleStatus,
            canClaim: !matchedUserCoupon && lifecycleStatus === USER_COUPON_STATUS.AVAILABLE,
            isClaimed: Boolean(matchedUserCoupon),
            isUsed,
            claimedAt,
            usedAt
        };
    }

    private mapClaimedCouponItem(userCoupon: UserCoupons): UserCouponItem {
        const coupon = userCoupon.coupon;
        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        const couponData = coupon.dataValues;
        const lifecycleStatus = this.getCouponLifecycleStatus(coupon);
        const isUsed = Boolean(userCoupon.dataValues.isUsed);

        return {
            userCouponId: Number(userCoupon.dataValues.id),
            couponId: Number(couponData.id),
            code: couponData.code,
            name: couponData.name,
            description: couponData.description || null,
            type: couponData.type,
            value: Number(couponData.value),
            minOrderValue: Number(couponData.minOrderAmount),
            maxUser: Number(couponData.maxUsers),
            currentUsers: Number(couponData.currentUsers || 0),
            remainingQuantity: Math.max(Number(couponData.maxUsers) - Number(couponData.currentUsers || 0), 0),
            validFrom: couponData.validFrom,
            validTo: couponData.validTo,
            isActive: Boolean(couponData.isActive),
            status: isUsed ? USER_COUPON_STATUS.USED : lifecycleStatus,
            canClaim: false,
            isClaimed: true,
            isUsed,
            claimedAt: userCoupon.dataValues.claimedAt ?? null,
            usedAt: userCoupon.dataValues.usedAt ?? null
        };
    }

    private getCouponLifecycleStatus(coupon: Coupons): CouponLifecycleStatus {
        const couponData = coupon.dataValues;
        const now = new Date();

        if (!couponData.isActive) {
            return USER_COUPON_STATUS.INACTIVE;
        }

        if (Number(couponData.currentUsers || 0) >= Number(couponData.maxUsers || 0)) {
            return USER_COUPON_STATUS.OUT_OF_STOCK;
        }

        if (now < couponData.validFrom) {
            return USER_COUPON_STATUS.UPCOMING;
        }

        if (now > couponData.validTo) {
            return USER_COUPON_STATUS.EXPIRED;
        }

        return USER_COUPON_STATUS.AVAILABLE;
    }

    private getClaimErrorMessage(status: CouponLifecycleStatus): string {
        switch (status) {
            case USER_COUPON_STATUS.INACTIVE:
                return 'Coupon is inactive';
            case USER_COUPON_STATUS.OUT_OF_STOCK:
                return 'Coupon has been reached out';
            case USER_COUPON_STATUS.UPCOMING:
                return 'Coupon is not available yet';
            case USER_COUPON_STATUS.EXPIRED:
                return 'Coupon expired';
            default:
                return 'Coupon cannot be claimed';
        }
    }

    private getValidateErrorMessage(status: CouponLifecycleStatus): string {
        switch (status) {
            case USER_COUPON_STATUS.INACTIVE:
                return 'Coupon is inactive';
            case USER_COUPON_STATUS.OUT_OF_STOCK:
                return 'Coupon has been reached out';
            case USER_COUPON_STATUS.UPCOMING:
                return 'Coupon is not available yet';
            case USER_COUPON_STATUS.EXPIRED:
                return 'Coupon expired';
            default:
                return 'Coupon is invalid';
        }
    }

    private async findCouponById(id: number): Promise<Coupons> {
        const coupon = await this.modelCoupon.findByPk(id);

        if (!coupon) {
            throw new NotFoundException(`Coupon with id ${id} not found`);
        }

        return coupon;
    }

    private normalizeCouponCode(code: string): string {
        return code.trim().toUpperCase();
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        return 'Unexpected error';
    }

    private toValidDate(value: Date | string, fieldName: string): Date {
        const parsedDate = value instanceof Date ? value : new Date(value);

        if (Number.isNaN(parsedDate.getTime())) {
            throw new BadRequestException(`${fieldName} is invalid`);
        }

        return parsedDate;
    }

    private ensureUserId(userId: number) {
        if (!userId) {
            throw new BadRequestException('User id not found');
        }
    }

    private validateCouponBusinessRules(
        data: {
            type: COUPONTYPE;
            value: number;
            minOrderValue: number;
            maxUser: number;
            validFrom: Date;
            validTo: Date;
        },
        currentUsers = 0
    ) {
        if (data.type === COUPONTYPE.PERCENT && data.value > 100) {
            throw new BadRequestException('Percent coupon value cannot be greater than 100');
        }

        if (data.minOrderValue < 0) {
            throw new BadRequestException('Minimum order value cannot be negative');
        }

        if (data.maxUser < 1) {
            throw new BadRequestException('Max users must be greater than 0');
        }

        if (data.maxUser < currentUsers) {
            throw new BadRequestException('Max users cannot be smaller than current used users');
        }

        if (data.validFrom.getTime() >= data.validTo.getTime()) {
            throw new BadRequestException('validFrom must be earlier than validTo');
        }
    }

    private async ensureCouponCodeAvailable(code: string, transaction?: Transaction, excludeId?: number) {
        const existedCoupon = await this.modelCoupon.findOne({
            where: {
                code,
                ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
            },
            transaction
        });

        if (existedCoupon) {
            throw new BadRequestException('Coupon code already exists');
        }
    }

    private mapCouponData(coupon: Coupons): CouponOutputData {
        return {
            id: Number(coupon.dataValues.id),
            code: coupon.dataValues.code,
            name: coupon.dataValues.name,
            description: coupon.dataValues.description || null,
            type: coupon.dataValues.type,
            value: Number(coupon.dataValues.value),
            minOrderValue: Number(coupon.dataValues.minOrderAmount),
            maxUser: Number(coupon.dataValues.maxUsers),
            currentUsers: Number(coupon.dataValues.currentUsers || 0),
            validFrom: coupon.dataValues.validFrom,
            validTo: coupon.dataValues.validTo,
            isActive: Boolean(coupon.dataValues.isActive),
            createdAt: coupon.dataValues.createdAt as Date,
            updatedAt: coupon.dataValues.updatedAt as Date,
        };
    }
}
