import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { SeederController } from './seeder.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import {  Category, Ingredient, Product, ProductIngredient, ProductVariant, User } from '@/models';

@Module({
  controllers: [SeederController],
  providers: [SeederService],
  imports:[SequelizeModule.forFeature([User,Category,Product,ProductIngredient,ProductVariant,Ingredient])]
})
export class SeederModule {}
