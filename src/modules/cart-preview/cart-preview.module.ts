import { Module } from '@nestjs/common';
import { CartPreviewService } from './cart-preview.service';
import { CartPreviewController } from './cart-preview.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Address, CartItems, CartItemsIngredient, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { CartItemModule } from '../cart-item/cart-item.module';
import { CartModule } from '../cart/cart.module';
import { AddressModule } from '../address/address.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  controllers: [CartPreviewController],
  providers: [CartPreviewService],
  imports:[SequelizeModule.forFeature([CartItems, CartItemsIngredient,Product,ProductIngredient, ProductVariant, Ingredient, Address]), CartItemModule, CartModule, AddressModule, CouponModule]
})
export class CartPreviewModule {}
