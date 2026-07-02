import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartItemComboOption, CartItemComboOptionIngredient, CartItems, Carts, Combo, ComboItem, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';

@Module({
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
  imports: [SequelizeModule.forFeature([CartItemComboOption, CartItemComboOptionIngredient, CartItems, Carts, Combo, ComboItem, Ingredient, ProductVariant, Product, ProductIngredient])],
})
export class PricingModule {}
