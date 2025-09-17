import { Module } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CartItemController } from './cart-item.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartItems, CartItemsIngredient, Carts, Product, ProductIngredient, ProductVariant } from '@/models';
import { ProductModule } from '../product/product.module';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { CartModule } from '../cart/cart.module';
import { CartItemIngredientService } from '../cart-item-ingredient/cart-item-ingredient.service';
import { CartItemIngredientModule } from '../cart-item-ingredient/cart-item-ingredient.module';

@Module({
  controllers: [CartItemController],
  providers: [CartItemService],
  imports: [SequelizeModule.forFeature([CartItems, Carts, Product, ProductVariant, CartItemsIngredient, ProductIngredient]), ProductModule, ProductVariantModule, CartItemIngredientModule, CartModule],
  exports: [CartItemService]
})
export class CartItemModule {}
