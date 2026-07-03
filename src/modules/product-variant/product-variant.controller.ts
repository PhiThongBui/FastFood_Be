import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';

@Controller('product-variant')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) { }
  @Get('/isCombo/:id')
  findProductIsCombo(@Param('id') id: number, @Query('comboItemId') comboItemId?: number) {
    return this.productVariantService.findProductIsCombo(id, comboItemId);
  }
}
