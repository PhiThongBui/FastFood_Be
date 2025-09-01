import { applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { IsArray, Max, Min } from "sequelize-typescript";

export const StringRequired = (name) => applyDecorators(
    ApiProperty({ required: true }),
    IsString({ message: `${name} là bắt buộc` }),
    IsNotEmpty({ message: `${name} không được để trống` })
)

export const StringNotRequired = applyDecorators(
    ApiProperty({
        required: false
    }),
    IsString(),
    IsOptional(),
)
export const NumberNotRequired = applyDecorators(
    ApiProperty({
        required: false,
    }),
    IsOptional(),
    Type(() => Number),
    IsNumber(),
)
export const NumberRequired = (name: string, min = 0, max?: number) => {
    const decorators = [
        ApiProperty({ required: true }),
        IsNumber(),
        IsNotEmpty({ message: `${name} không được để trống` }),
    ];

    if (min !== undefined) {
        decorators.push(() => Min(min));
    }
    if (max !== undefined) {
        decorators.push(() => Max(max));
    }
    return applyDecorators(...decorators);
};


export const BooleanNotRequired = applyDecorators(
    ApiProperty({
        required: false
    }),
    IsBoolean(),
    IsOptional()
)

export const EnumRequired = (name: string, type: any) => applyDecorators(
    ApiProperty({ required: true }),
    IsEnum(type),
    IsNotEmpty({ message: `${name} không được để trống` })
)

export const EnumNotRequired = (type: any) => applyDecorators(
    ApiProperty({ required: false }),
    IsEnum(type),
    IsOptional()
)


export const ArrayNotRequired = (array: any) => applyDecorators(
    ApiProperty({ 
        required: false, 
        isArray: true,    
        type: array 
    }),
    IsOptional(),
    ValidateNested({ each: true }),
    Type(() => array),
)
