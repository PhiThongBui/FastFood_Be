import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { CategoryModule } from '../category/category.module';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports:[SequelizeModule.forFeature([Category, ProductIngredient, ProductVariant, Product,Ingredient]), CategoryModule]
})
export class ProductModule {}
