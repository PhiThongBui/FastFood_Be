import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Khách yêu cầu hủy đơn' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
