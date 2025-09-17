import { Body, Controller, Get, Param } from '@nestjs/common';
import { CartItemIngredientService } from './cart-item-ingredient.service';
import { ingredients } from '../seeder/data/data';

@Controller('cart-item-ingredient')
export class CartItemIngredientController {
  constructor(private readonly cartItemIngredientService: CartItemIngredientService) { }

  @Get('getone/:id')
  getOneCartItemIngredient(@Param('id') id: number, @Body('ingredientsId') ingredientsId: number[]) {
    return this.cartItemIngredientService.existedCartItemIngredient(id, ingredientsId)
  }

  @Get('has-ingredient/:cartitemid')
  getHasIngredient(@Param('cartitemid') cartitemid: number) {
    return this.cartItemIngredientService.hasIngredient(cartitemid)
  }

  @Get('existed-cartitem-ingredient')
  getExistedCartItem(@Body('ingredientsId') ingredientsId: number[], @Body('cartItemId') cartItemId: number) {
    return this.cartItemIngredientService.existedCartItemIngredient(cartItemId, ingredientsId)
  }

  @Get('get-all')
  getAllCartItemIngredient() {
    return this.cartItemIngredientService.getAllCartItemIngredient()
  }
}
