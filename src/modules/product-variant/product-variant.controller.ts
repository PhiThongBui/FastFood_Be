import { Controller, Get, Param } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';

@Controller('product-variant')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Get('/:id/variant-combo')
  findByIdCustom(@Param('id') id: number) {
    return this.productVariantService.findByIdCustom(id);
  }

  @Get('/isCombo/:id')
  findProductIsCombo(@Param('id') id: number) {
    return this.productVariantService.findProductIsCombo(id);
  }
}
