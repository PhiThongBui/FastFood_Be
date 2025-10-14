import { DateRequired, EnumRequired, NumberRequired, StringNotRequired, StringRequired } from "@/common/decorators"
import { COUPONTYPE } from "@/models/coupons.model"

export class CreateCouponDto{
    @StringRequired('Mã khuyến mãi')
    code:string
    @StringRequired('Tên khuyến mãi')
    name:string

    @StringNotRequired
    description?:string

    @EnumRequired('Loại khuyến mãi',COUPONTYPE)
    type:COUPONTYPE

    @NumberRequired('Giá trị khuyến mãi',1)
    value:number

    @NumberRequired('Giá trị tối thiểu đơn hàng',10000)
    minOrderValue:number

    @NumberRequired('Số lượng người dùng',10)
    maxUser:number

    @DateRequired('Ngày bắt đầu sử dụng')
    validFrom:Date

    @DateRequired('Ngày kết thúc sử dụng')
    validTo:Date
}