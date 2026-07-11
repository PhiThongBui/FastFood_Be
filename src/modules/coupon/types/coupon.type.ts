import { COUPONTYPE } from '@/models/coupons.model';

export enum USER_COUPON_STATUS {
    ALL = 'ALL',
    AVAILABLE = 'AVAILABLE',
    USED = 'USED',
    EXPIRED = 'EXPIRED',
    UPCOMING = 'UPCOMING',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    INACTIVE = 'INACTIVE',
}

export type CreateOutputCoupon = {
    message: string,
    data: {
        id: number
        code: string
        name: string
        description: string | null
        type: COUPONTYPE
        value: number
        minOrderValue: number
        maxUser: number
        currentUsers: number
        validFrom: Date
        validTo: Date
        isActive: boolean
        createdAt: Date
        updatedAt: Date
    }
}

export type ValidateCoupon = {
    message: string,
    discount: number,
    couponInfo: {
        code: string
        type: COUPONTYPE
        value: number
    }
}

export type UserCouponItem = {
    userCouponId: number | null
    couponId: number
    code: string
    name: string
    description: string | null
    type: COUPONTYPE
    value: number
    minOrderValue: number
    maxUser: number
    currentUsers: number
    remainingQuantity: number
    validFrom: Date
    validTo: Date
    isActive: boolean
    status: Exclude<USER_COUPON_STATUS, USER_COUPON_STATUS.ALL>
    canClaim: boolean
    isClaimed: boolean
    isUsed: boolean
    claimedAt: Date | null
    usedAt: Date | null
}
