import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Carts, User } from '@/models';

@Module({
  controllers: [CartController],
  providers: [CartService],
  imports: [SequelizeModule.forFeature([Carts, User])],
  exports: [CartService]
})
export class CartModule {}
