import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Address, CartItemComboOption, CartItemComboOptionIngredient, CartItems, CartItemsIngredient, Carts, Order, OrderItemComboOption, OrderItemComboOptionIngredient, OrderItemIngredient, OrderItems } from '@/models';
import { SepayModule } from '../sepay/sepay.module';
import { CartPreviewModule } from '../cart-preview/cart-preview.module';
import { CartModule } from '../cart/cart.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  controllers: [CheckoutController],
  providers: [CheckoutService],
  imports: [SequelizeModule.forFeature([Address, Carts, CartItems, CartItemsIngredient, CartItemComboOption, CartItemComboOptionIngredient, Order, OrderItems, OrderItemIngredient, OrderItemComboOption, OrderItemComboOptionIngredient]), SepayModule, CartPreviewModule, CartModule, CouponModule],
})
export class CheckoutModule {}
