import { Module } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ProductVariantController } from './product-variant.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ComboItem, Product, ProductVariant } from '@/models';

@Module({
  controllers: [ProductVariantController],
  providers: [ProductVariantService],
  imports: [SequelizeModule.forFeature([ProductVariant,Product,ComboItem])],
  exports:[ProductVariantService]
})
export class ProductVariantModule {}
