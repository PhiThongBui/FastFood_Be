import { Module } from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { IngredientController } from './ingredient.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Ingredient } from '@/models';

@Module({
  controllers: [IngredientController],
  providers: [IngredientService],
  exports: [IngredientService],
  imports: [SequelizeModule.forFeature([Ingredient])],
})
export class IngredientModule {}
