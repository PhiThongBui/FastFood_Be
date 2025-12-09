import { Body, Controller, Get, Post } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { GetPricingNoQuantityDto } from './dto/getPricingNoQuantity.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Serialize } from '@/common/interceptors/serialize.interceptor';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) { }

  @Post('get-single-pricing')
  @ApiOperation({summary:'Lấy ra giá của variant hoặc giá cơ bản của sản phẩm chỉ truyền vào 1 trong 2 ID'})
  async getSiglePricing(@Body() dto: GetPricingNoQuantityDto) {    
    return await this.pricingService.getSinglePricing(dto);
  }
}
