import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GetPricingFeatureDto, GetPricingNoQuantityDto } from './dto/getPricingNoQuantity.dto';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) { }

  @Post('get-combo-variant-pricing')
  @ApiOperation({ summary: 'Lấy giá đổi món trong combo, bắt buộc truyền productVariantId va comboItemId' })
  async getSiglePricing(@Body() dto: GetPricingNoQuantityDto) {
    return await this.pricingService.getSinglePricing(dto);
  }

  @Post('get-single-pricing-feature')
  @ApiOperation({ summary: 'Lấy giá cho sản phẩm theo tính năng' })
  async getSinglePricingFeature(@Body() dto: GetPricingFeatureDto) {
    return await this.pricingService.getSinglePricingFeature(dto);
  }
}
