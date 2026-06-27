import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GetPricingFeatureDto, GetPricingNoQuantityDto } from './dto/getPricingNoQuantity.dto';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) { }

  @Post('get-combo-variant-pricing')
  @ApiOperation({ summary: 'Lay gia doi mon trong combo, bat buoc truyen productVariantId va comboItemId' })
  async getSiglePricing(@Body() dto: GetPricingNoQuantityDto) {
    return await this.pricingService.getSinglePricing(dto);
  }

  @Post('get-single-pricing-feature')
  @ApiOperation({ summary: 'Lay gia theo logic cu cua get-single-pricing' })
  async getSinglePricingFeature(@Body() dto: GetPricingFeatureDto) {
    return await this.pricingService.getSinglePricingFeature(dto);
  }
}
