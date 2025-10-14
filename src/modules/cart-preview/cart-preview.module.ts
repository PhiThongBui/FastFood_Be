import { Module } from '@nestjs/common';
import { CartPreviewService } from './cart-preview.service';
import { CartPreviewController } from './cart-preview.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartItems, CartItemsIngredient, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { CartItemModule } from '../cart-item/cart-item.module';
import { CartModule } from '../cart/cart.module';

@Module({
  controllers: [CartPreviewController],
  providers: [CartPreviewService],
  imports:[SequelizeModule.forFeature([CartItems, CartItemsIngredient,Product,ProductIngredient, ProductVariant, Ingredient]), CartItemModule, CartModule]
})
export class CartPreviewModule {}
