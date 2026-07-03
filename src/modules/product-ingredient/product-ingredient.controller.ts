import { Controller, Get, Param } from '@nestjs/common';
import { ProductIngredientService } from './product-ingredient.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('product-ingredient')
export class ProductIngredientController {
  constructor(private readonly productIngredientService: ProductIngredientService) {}

  @Get('/get-ingredient-default/:productId')
  @ApiOperation({ summary: 'Lấy ingredient default theo productId' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  getIngredientDefault(@Param('productId') productId: number) {    
    return this.productIngredientService.getIngredientDefaultById(productId);
  }
}
