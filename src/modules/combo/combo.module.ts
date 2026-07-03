import { Module } from '@nestjs/common';
import { ComboService } from './combo.service';
import { ComboController } from './combo.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Combo } from '@/models/combo.model';
import { ComboItem } from '@/models/combo-item.model';
import { Category, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { CategoryModule } from '../category/category.module';

@Module({
  controllers: [ComboController],
  providers: [ComboService],
  imports: [SequelizeModule.forFeature([Combo, ComboItem, Category, Product, ProductVariant, ProductIngredient, Ingredient]), CategoryModule],
})
export class ComboModule {}
