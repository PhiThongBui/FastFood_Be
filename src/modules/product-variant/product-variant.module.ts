import { Module } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ProductVariantController } from './product-variant.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { ProductModule } from '../product/product.module';

@Module({
  controllers: [ProductVariantController],
  providers: [ProductVariantService],
  imports: [SequelizeModule.forFeature([ProductVariant,Product,ProductIngredient, Ingredient])],
  exports:[ProductVariantService]
})
export class ProductVariantModule {}
