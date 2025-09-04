import { Module } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CartItemController } from './cart-item.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartItems, Carts, Product, ProductVariant } from '@/models';
import { ProductModule } from '../product/product.module';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { CartModule } from '../cart/cart.module';

@Module({
  controllers: [CartItemController],
  providers: [CartItemService],
  imports: [SequelizeModule.forFeature([CartItems, Carts, Product, ProductVariant]), ProductModule, ProductVariantModule, CartModule],
})
export class CartItemModule {}
