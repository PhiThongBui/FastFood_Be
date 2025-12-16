import { BadRequestException, Body, Controller, Get, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { CartPreviewService } from './cart-preview.service';
import { Sequelize } from 'sequelize-typescript';
import { Helper } from '@/utils/helper';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CartService } from '../cart/cart.service';
import { CheckoutCaculateDto } from './dto/checkout.dto';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';

@Controller('cart-preview')
export class CartPreviewController {
  constructor(
    private readonly cartPreviewService: CartPreviewService,
    private readonly sequelize: Sequelize,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cartService: CartService

  ) { }
  private readonly logger = new Logger('CartPreviewController');
  @Get('/checkout-preview')
  async getCartPreview(@Body('cartItemId') cartItemId: number[], @Req() req: Request) {
    const transaction = await this.sequelize.transaction();

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

  @UseGuards(JWTGuard)
  @Post('/checkout-calculate')
  async checkoutCaculate(@Body() dto: CheckoutCaculateDto, @Req() req: Request) {
    const transaction = await this.sequelize.transaction();
    try {
      if (!dto.addressId && !dto.temporaryAddress) {
        throw new BadRequestException('Either addressId or temporaryAddress must be provided.');
      }

      if (dto.addressId && dto.temporaryAddress) {
        throw new BadRequestException('Cannot use both addressId and temporaryAddress at the same time.');
      }
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
      if (!userId) {
        throw new BadRequestException('User id not found')
      }

      const cartId = await this.cartService.getCartByContext(sessionId, userId, transaction)

      return await this.cartPreviewService.checkoutCaculate(userId, cartId?.dataValues?.id, dto, transaction);
    } catch (error) {
      console.log(error);
      await transaction.rollback()
      throw new BadRequestException(error.message)
    }
  }


}
