import { ApiProperty } from "@nestjs/swagger";
import { applyDecorators } from "@nestjs/common";
import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ComboItemDto } from "@/modules/combo/dto/create-combo.dto";

export const ComboItems = () =>
  applyDecorators(
    ApiProperty({
      description:
        'Danh sách sản phẩm con trong combo (mỗi phần tử gồm productId, quantity, productVariantId, ...)',
      required: true,
      isArray: true,
      type: () => ComboItemDto,
      example: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
        { productId: 3, productVariantId: 12, quantity: 1 },
      ],
    }),
    IsArray({ message: 'comboItems phải là một mảng' }),
    ValidateNested({ each: true }),
    Type(() => ComboItemDto)
  );
