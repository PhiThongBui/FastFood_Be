import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { Request } from 'express';
import { CheckoutConfirmDto } from './dto/checkout-confirm.dto';
import { Helper } from '@/utils/helper';
import { CartService } from '../cart/cart.service';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly cartService: CartService,
  ) { }

  @UseGuards(JWTGuard)
  @Post('confirm')
  async confirmCheckout(@Req() req: Request, @Body() dto: CheckoutConfirmDto) {
    const sessionId = Helper.getSessionIdFromRequest(req)
    const userId = (req.user as { uid: number; role: string }).uid;
    const cart = await this.cartService.getCartByContext(sessionId, userId)
    return this.checkoutService.confirmCheckout(userId, cart?.dataValues?.id, dto);
  }
}
