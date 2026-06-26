import { Body, Controller, Post } from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetIngredientPricesDto } from './dto/get-ingredient-prices.dto';

@Controller('ingredient')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Post('get-ingredient-prices')
  @ApiOperation({ summary: 'Lấy giá của nhiều ingredient theo danh sách ID' })
  @ApiBody({
    type: GetIngredientPricesDto,
    examples: {
      default: {
        summary: 'Danh sách ingredient ID',
        value: {
          ingredientIds: [1, 4]
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Lấy giá ingredient thành công',
    schema: {
      example: {
        ingredients: [
          { id: 1, price: 12000 },
          { id: 4, price: 8000 },
          { id: 1, price: 12000 }
        ],
        totalPrice: 32000
      }
    }
  })
  async getIngredientPrices(@Body() dto: GetIngredientPricesDto) {
    return await this.ingredientService.getIngredientPrices(dto);
  }
}
