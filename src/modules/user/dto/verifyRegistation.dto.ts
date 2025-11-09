import { StringRequired } from "@/common/decorators";

export class VerifyRegistationDto {
    @StringRequired('OTP')
    otp: string

    @StringRequired('Email')
    email: string
}

export class ResendRegistationDto {
    @StringRequired('Email')
    email: string
}