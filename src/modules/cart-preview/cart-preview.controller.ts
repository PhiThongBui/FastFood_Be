import { Body, Controller, Get, Req } from '@nestjs/common';
import { CartPreviewService } from './cart-preview.service';
import { Sequelize } from 'sequelize-typescript';
import { Helper } from '@/utils/helper';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CartService } from '../cart/cart.service';

@Controller('cart-preview')
export class CartPreviewController {
  constructor(
    private readonly cartPreviewService: CartPreviewService,
    private readonly sequelize: Sequelize,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cartService: CartService

  ) { }

  @Get('/checkout-preview')
  async getCartPreview(@Body('cartItemId') cartItemId: string[], @Req() req: Request) {
    const transaction =await this.sequelize.transaction();

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
    return await this.cartPreviewService.cartPreview(cartId?.dataValues?.id, cartItemId, transaction);
  }

  
}
