import { Module } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ProductVariantController } from './product-variant.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ComboItem, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { ProductModule } from '../product/product.module';

@Module({
  controllers: [ProductVariantController],
  providers: [ProductVariantService],
  imports: [SequelizeModule.forFeature([ProductVariant,Product,ProductIngredient, Ingredient, ComboItem])],
  exports:[ProductVariantService]
})
export class ProductVariantModule {}
