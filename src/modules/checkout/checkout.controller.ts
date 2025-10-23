import { Body, Controller, Post, Req } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { Request } from 'express';
import { CheckoutConfirmDto } from './dto/checkout-confirm.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Helper } from '@/utils/helper';
import { Sequelize } from 'sequelize-typescript';
import { CartService } from '../cart/cart.service';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cartService: CartService,
    private readonly transaction: Sequelize
  ) { }

  @Post('confirm')
  async confirmCheckout(@Req() req: Request, @Body() dto: CheckoutConfirmDto) {
    const transaction = await this.transaction.transaction();
    const sessionId = Helper.getSessionIdFromRequest(req)
    let userId: number | null = null
    const authBearer = req.headers?.authorization
    if (authBearer && authBearer.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7)
        const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any
        userId = decoded.uid
      } catch (error) {
        userId = null
      }
    }
    const cartId = await this.cartService.getCartByContext(sessionId, userId, transaction)
    return this.checkoutService.confirmCheckout(userId as any, cartId?.dataValues?.id, dto);
  }
}
