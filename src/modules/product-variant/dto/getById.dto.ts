import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class GetByIdDto {
  @ApiProperty({ example: 1, description: 'ID variant' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Nhỏ (20cm) Mỏng', description: 'Tên variant' })
  @Expose()
  name: string;

  @ApiProperty({ example: '20cm', description: 'Kích thước' })
  @Expose()
  size: string;

  @ApiProperty({ example: 'Mỏng', description: 'Loại bột' })
  @Expose()
  type: string;

  @ApiProperty({ example: 10000, description: 'Giá điều chỉnh' })
  @Expose()
  modifiedPrice: number;

  @ApiProperty({ example: 189000, description: 'Giá cuối cùng' })
  @Expose()
  variantPrice: number;
}