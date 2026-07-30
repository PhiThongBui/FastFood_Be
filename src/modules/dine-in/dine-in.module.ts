import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
    CartItems,
    Carts,
    DiningTable,
    KitchenTicket,
    Order,
    TableSession,
    User,
} from '@/models';
import { CartItemModule } from '../cart-item/cart-item.module';
import { CartPreviewModule } from '../cart-preview/cart-preview.module';
import { OrderItemSnapshotModule } from '../order-item-snapshot/order-item-snapshot.module';
import { RedisModule } from '../redis/redis.module';
import { SepayModule } from '../sepay/sepay.module';
import { DiningTableController } from './dining-table.controller';
import { DineInController } from './dine-in.controller';
import { DineInService } from './dine-in.service';
import { StaffDineInController } from './staff-dine-in.controller';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

@Module({
    imports: [
        SequelizeModule.forFeature([
            DiningTable,
            TableSession,
            KitchenTicket,
            Order,
            CartItems,
            Carts,
            User,
        ]),
        CartItemModule,
        CartPreviewModule,
        OrderItemSnapshotModule,
        RedisModule,
        SepayModule,
    ],
    controllers: [DiningTableController, DineInController, StaffDineInController],
    providers: [DineInService, PermissionsGuard],
    exports: [DineInService],
})
export class DineInModule {}
