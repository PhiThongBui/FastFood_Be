import { Controller, Get, Param } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';

@Controller('product-variant')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) { }
  @Get('/isCombo/:id')
  findProductIsCombo(@Param('id') id: number) {
    return this.productVariantService.findProductIsCombo(id);
  }
}
