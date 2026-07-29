import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCartItemDto } from '@/modules/cart-item/dto/cart-item.dto';
import { KITCHEN_TICKET_STATUS } from '@/models';

export class DineInAddItemDto extends CreateCartItemDto {}

export class StaffOpenTableSessionDto {
    @IsNumber()
    @Type(() => Number)
    tableId: number;
}

export class SubmitKitchenTicketDto {
    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    @IsOptional()
    cartItemIds?: number[];

    @IsString()
    @IsOptional()
    notes?: string;
}

export class PayTableSessionDto {
    @IsString()
    paymentMethod: string;
}

export class UpdateKitchenTicketStatusDto {
    @IsEnum(KITCHEN_TICKET_STATUS)
    status: KITCHEN_TICKET_STATUS;
}
