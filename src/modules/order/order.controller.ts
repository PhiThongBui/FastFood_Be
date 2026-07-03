import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JWTGuard)
  @Get('my-orders')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của tôi' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm theo mã đơn hoặc tên món/combo' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Lọc tổng tiền từ' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Lọc tổng tiền đến' })
  @ApiQuery({ name: 'orderStatus', required: false, description: 'Trạng thái đơn hàng' })
  @ApiQuery({ name: 'paymentStatus', required: false, description: 'Trạng thái thanh toán' })
  getMyOrders(@Req() req: any, @Query() query: Record<string, string>) {
    return this.orderService.getMyOrders(Number(req.user?.uid), query);
  }
}
