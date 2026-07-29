import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
    CartItemComboOption,
    CartItemComboOptionIngredient,
    CartItems,
    CartItemsIngredient,
    Ingredient,
    OrderItemComboOption,
    OrderItemComboOptionIngredient,
    OrderItemIngredient,
    OrderItems,
} from '@/models';
import { OrderItemSnapshotService } from './order-item-snapshot.service';

@Module({
    imports: [
        SequelizeModule.forFeature([
            CartItems,
            CartItemsIngredient,
            CartItemComboOption,
            CartItemComboOptionIngredient,
            Ingredient,
            OrderItems,
            OrderItemIngredient,
            OrderItemComboOption,
            OrderItemComboOptionIngredient,
        ]),
    ],
    providers: [OrderItemSnapshotService],
    exports: [OrderItemSnapshotService],
})
export class OrderItemSnapshotModule {}
