import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ORDERSTATUS } from '@/models/order.model';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDERSTATUS, example: ORDERSTATUS.PREPARING })
  @IsEnum(ORDERSTATUS)
  orderStatus: ORDERSTATUS;

  @ApiPropertyOptional({ example: 'Khach yeu cau huy don' })
  @IsOptional()
  @IsString()
  cancelledReason?: string;
}
