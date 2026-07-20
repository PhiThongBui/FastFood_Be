import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class AdminOrderDateRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01', description: 'Start date, ISO date or date-time' })
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-07-31', description: 'End date, ISO date or date-time' })
  @IsOptional()
  toDate?: string;
}

export class AdminOrderRevenueQueryDto extends AdminOrderDateRangeQueryDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'day' })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}

export class AdminOrderLimitQueryDto extends AdminOrderDateRangeQueryDto {
  @ApiPropertyOptional({ example: 5, description: 'Maximum records returned' })
  @IsOptional()
  limit?: string | number;
}

export class AdminOrderListQueryDto extends AdminOrderDateRangeQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: string | number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: string | number;

  @ApiPropertyOptional({ example: 'OD-2401' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Order status value' })
  @IsOptional()
  orderStatus?: string;

  @ApiPropertyOptional({ description: 'Payment status value' })
  @IsOptional()
  paymentStatus?: string;
}
