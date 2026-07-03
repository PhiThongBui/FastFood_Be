import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Sequelize } from 'sequelize';
import { SequelizeModule } from '@nestjs/sequelize';
import { Address, Ingredient, Order, OrderItemComboOption, OrderItemComboOptionIngredient, OrderItemIngredient, OrderItems, Product, ProductVariant } from '@/models';
import { AddressModule } from '../address/address.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [SequelizeModule.forFeature([Order, Address, OrderItems, ProductVariant, Product, Ingredient, OrderItems, OrderItemIngredient, OrderItemComboOption, OrderItemComboOptionIngredient]), AddressModule],
})
export class OrderModule {}
