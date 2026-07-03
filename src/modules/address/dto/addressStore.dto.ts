import { BooleanNotRequired, NumberNotRequired, NumberRequired, StringNotRequired, StringRequired } from "@/common/decorators";

export class DistanceCalculationResultDto {
    distance!: number;
    duration!: number;
    status!: string
}


export class CreateAddressDto {
    @StringRequired('Họ tên người nhận hàng')
    recipientName!: string;

    @StringRequired('Số điện thoại người nhận hàng')
    recipientPhone!: string;

    @StringRequired('Thành phố người nhận hàng')
    city!: string;

    @StringNotRequired
    ward?: string;

    @StringNotRequired
    street?: string;

    @StringRequired('Quận huyện người nhận hàng')
    district!: string;

    @NumberRequired('Kinh độ người nhận hàng')
    latitude!: number;

    @NumberRequired('Vĩ độ người nhận hàng')
    longitude!: number;

    @BooleanNotRequired
    isDefault?: boolean

    @StringNotRequired
    sessionId?: string

    @NumberNotRequired
    userId?: number;
}