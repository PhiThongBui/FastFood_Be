import { IsNumber, IsEnum, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PAYMENTMETHOD } from '@/models/order.model';

export class TemporaryAddressDto {
    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsString()
    fullAddress: string;

    @IsString()
    @IsOptional()
    recipientName?: string;

    @IsString()
    @IsOptional()
    recipientPhone?: string;
}

export class CheckoutConfirmDto {
    @IsArray()
    @Type(() => Number)
    @IsNumber({}, { each: true })
    cartItemIds: number[];

    @IsNumber()
    @IsOptional()
    addressId?: number;

    @ValidateNested()
    @Type(() => TemporaryAddressDto)
    @IsOptional()
    temporaryAddress?: TemporaryAddressDto;

    @IsEnum(PAYMENTMETHOD)
    paymentMethod: PAYMENTMETHOD;

    @IsString()
    @IsOptional()
    couponCode?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
