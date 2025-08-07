import { applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

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


export const BooleanNotRequired = applyDecorators(
    ApiProperty({
        required: false
    }),
    IsBoolean(),
    IsOptional()
)