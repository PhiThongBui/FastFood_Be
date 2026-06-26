import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartItems, Carts, ComboItem, Product, ProductIngredient, ProductVariant } from '@/models';

@Module({
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
  imports: [SequelizeModule.forFeature([CartItems, Carts, ComboItem, ProductVariant, Product, ProductIngredient])],
})
export class PricingModule {}
