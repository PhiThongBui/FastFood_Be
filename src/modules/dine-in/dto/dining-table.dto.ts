import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DINING_TABLE_STATUS } from '@/models';

export class CreateDiningTableDto {
    @IsString()
    code: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    area?: string;

    @IsEnum(DINING_TABLE_STATUS)
    @IsOptional()
    status?: DINING_TABLE_STATUS;
}

export class UpdateDiningTableDto {
    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    area?: string;

    @IsEnum(DINING_TABLE_STATUS)
    @IsOptional()
    status?: DINING_TABLE_STATUS;
}
