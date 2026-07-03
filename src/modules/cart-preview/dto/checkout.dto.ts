import { NumberNotRequired, StringNotRequired } from "@/common/decorators"
import { Type } from "class-transformer"
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"

export class CheckoutCaculateDto {
    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    cartItemIds!: number[]

    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    @IsOptional()
    cartItemId?: number[]

    @NumberNotRequired
    addressId?: number

    @IsOptional()
    @ValidateNested()
    @Type(() => TemporaryAddressDto)
    temporaryAddress?: {
        latitude: number,
        longitude: number,
        recipientName: string,
        recipientPhone: string,
        city: string,
        district: string
    }

    @StringNotRequired
    couponCode?: string
    @NumberNotRequired
    sessionId?: string
}

export class TemporaryAddressDto {
    @IsNumber()
    @Type(() => Number)
    latitude!: number;

    @Type(() => Number)
    @IsNumber()
    longitude!: number;

    @Type(() => String)
    @IsString()
    recipientName!: string;

    @Type(() => String)
    @IsString()
    recipientPhone!: string;

    @IsString()
    @Type(() => String)
    city!: string;

    @IsString()
    @Type(() => String)
    district!: string;
}
