import { Module } from '@nestjs/common';
import { LookupService } from './lookup.service';
import { LookupController } from './lookup.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';

@Module({
  controllers: [LookupController],
  providers: [LookupService],
  imports: [SequelizeModule.forFeature([Product, ProductVariant, ProductIngredient, Ingredient])],
  exports: [LookupService],
})
export class LookupModule {}
