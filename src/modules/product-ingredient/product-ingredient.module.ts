import { Module } from '@nestjs/common';
import { ProductIngredientService } from './product-ingredient.service';
import { ProductIngredientController } from './product-ingredient.controller';
import { Sequelize } from 'sequelize';
import { SequelizeModule } from '@nestjs/sequelize';
import { Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';

@Module({
  controllers: [ProductIngredientController],
  providers: [ProductIngredientService],
  exports: [ProductIngredientService],
  imports: [SequelizeModule.forFeature([ProductIngredient, Product, ProductVariant, Ingredient])],
})
export class ProductIngredientModule {}
