import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartItems, CartItemsIngredient, Carts, Order, OrderItemIngredient, OrderItems } from '@/models';
import { SepayModule } from '../sepay/sepay.module';
import { CartPreviewModule } from '../cart-preview/cart-preview.module';
import { CartModule } from '../cart/cart.module';

@Module({
  controllers: [CheckoutController],
  providers: [CheckoutService],
  imports: [SequelizeModule.forFeature([Carts,CartItems,CartItemsIngredient,Order, OrderItems, OrderItemIngredient]), SepayModule, CartPreviewModule,CartModule],
})
export class CheckoutModule {}
