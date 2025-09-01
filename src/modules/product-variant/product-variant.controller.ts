import { Controller } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';

@Controller('product-variant')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}
}
