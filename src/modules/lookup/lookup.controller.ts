import { Controller, Get, Param } from '@nestjs/common';
import { LookupService } from './lookup.service';

@Controller('lookup')
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Get('variant/:productId')
  lookUpVariant(@Param('productId') productId: number) {
    return this.lookupService.lookUpVariant(productId);
  }


  @Get('change-variantcombo/:productId')
  lookUpChangeVariantCombo(@Param('productId') productId: number) {
    return this.lookupService.lookUpChangeVariantCombo(productId);
  }
}
