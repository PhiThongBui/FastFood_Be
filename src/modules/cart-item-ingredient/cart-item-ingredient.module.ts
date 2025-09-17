import { Module } from '@nestjs/common';
import { CartItemIngredientService } from './cart-item-ingredient.service';
import { CartItemIngredientController } from './cart-item-ingredient.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartItems, CartItemsIngredient, Ingredient } from '@/models';

@Module({
  controllers: [CartItemIngredientController],
  providers: [CartItemIngredientService],
  imports: [SequelizeModule.forFeature([CartItems, Ingredient, CartItemsIngredient])],
  exports: [CartItemIngredientService]
})
export class CartItemIngredientModule {}
