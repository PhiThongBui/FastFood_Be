import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Address, Combo, ComboItem, Ingredient, Order, OrderItemComboOption, OrderItemComboOptionIngredient, OrderItemIngredient, OrderItems, Product, ProductVariant, User } from '@/models';
import { AddressModule } from '../address/address.module';
import { RedisModule } from '../redis/redis.module';
import { StorePolicySettingModule } from '../store-policy-setting/store-policy-setting.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [SequelizeModule.forFeature([Order, Address, User, OrderItems, ProductVariant, Product, Ingredient, Combo, ComboItem, OrderItemIngredient, OrderItemComboOption, OrderItemComboOptionIngredient]), AddressModule, RedisModule, StorePolicySettingModule],
})
export class OrderModule {}
