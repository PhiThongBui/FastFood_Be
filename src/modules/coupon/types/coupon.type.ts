import { COUPONTYPE } from "@/models/coupons.model"

export type CreateOutputCoupon = {
    message: string,
    data: {
        code: string
        name: string
        description: string
        type: COUPONTYPE
        value: number
        minOrderValue: number
        maxUser: number
        validFrom: Date
        validTo: Date
    }
}