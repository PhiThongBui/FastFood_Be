import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category, Combo, ComboItem, Ingredient, Order, OrderItems, Product, ProductIngredient, ProductVariant, User } from '@/models';
import { CategoryModule } from '../category/category.module';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { IngredientModule } from '../ingredient/ingredient.module';
import { ProductIngredientModule } from '../product-ingredient/product-ingredient.module';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports:[SequelizeModule.forFeature([Category, ProductIngredient, ProductVariant, Product,Ingredient, Order, OrderItems, Combo, ComboItem, User]), CategoryModule, ProductVariantModule, ProductIngredientModule, IngredientModule],
  exports:[ProductService]
})
export class ProductModule {}
