import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { SeederController } from './seeder.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import {  Address, CartItemComboOption, CartItemComboOptionIngredient, CartItems, CartItemsIngredient, Carts, Category, Combo, ComboItem, Coupons, Ingredient, Order, OrderItemComboOption, OrderItemComboOptionIngredient, OrderItemIngredient, OrderItems, Product, ProductIngredient, ProductVariant, Reviews, User, UserCoupons } from '@/models';

@Module({
  controllers: [SeederController],
  providers: [SeederService],
  imports:[SequelizeModule.forFeature([Address, 
    Category, 
    Ingredient, 
    Product, 
    ProductIngredient, 
    ProductVariant, 
    User,
    Combo,
    ComboItem,
    Coupons,
    UserCoupons,
    Carts,
    CartItems,
    CartItemComboOption,
    CartItemComboOptionIngredient,
    CartItemsIngredient,
    Order,
    OrderItems,
    OrderItemComboOption,
    OrderItemComboOptionIngredient,
    OrderItemIngredient,
    Reviews])]
})
export class SeederModule {}
