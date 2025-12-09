import { Body, Controller, Get, Post } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { GetPricingNoQuantityDto } from './dto/getPricingNoQuantity.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Serialize } from '@/common/interceptors/serialize.interceptor';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) { }

  @Post('get-single-pricing')
  async getSiglePricing(@Body() dto: GetPricingNoQuantityDto) {    
    return await this.pricingService.getSinglePricing(dto);
  }
}
