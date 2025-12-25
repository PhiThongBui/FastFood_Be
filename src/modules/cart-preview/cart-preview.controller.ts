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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('cart-preview')
export class CartPreviewController {
  constructor(
    private readonly cartPreviewService: CartPreviewService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cartService: CartService

  ) { }
  private readonly logger = new Logger('CartPreviewController');
  @Post('/checkout-preview')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Xem trước thanh toán (Checkout Preview)',
    description: 'Tính toán giá trị thanh toán cho các CartItem được chọn'
  })
  @ApiOperation({
    summary: 'Checkout Preview',
    description: `
Yêu cầu xác định giỏ hàng thông qua:

- Authorization: Bearer token (đối với user đã đăng nhập)
- Cookie: sessionId (đối với khách vãng lai)

API sẽ tự động xác định cart tương ứng.
`
  })

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cartItemId: {
          type: 'array',
          items: { type: 'number' },
          example: [12, 15, 18]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Preview thành công'
  })
  async getCartDetail(
    @Body('cartItemId') cartItemId: number[],
    @Req() req: Request
  ) {
    const sessionId = Helper.getSessionIdFromRequest(req);
    let userId: number | null = null;

    const authBearer = req.headers?.authorization;
    if (authBearer?.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7);
        const decoded = this.jwtService.verify(
          token,
          this.configService.get('JWT_SECRET')
        ) as any;
        userId = decoded.uid;
      } catch {
        userId = null;
      }
    }
    const cart = await this.cartService.getCartByContext(
      sessionId,
      userId,
    );

    return await this.cartPreviewService.cartPreview(
      cart.id,
      cartItemId,
    );
  }

  @Get('/cart')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Xem giỏ hàng của mình',
  })
  @ApiOperation({
    summary: 'Cart Preview',
    description: `
Yêu cầu xác định giỏ hàng thông qua:

- Authorization: Bearer token (đối với user đã đăng nhập)
- Cookie: sessionId (đối với khách vãng lai)

API sẽ tự động xác định cart tương ứng.
`
  })
  async getCartPreview(
    @Req() req: Request
  ) {
    const sessionId = Helper.getSessionIdFromRequest(req);
    let userId: number | null = null;

    const authBearer = req.headers?.authorization;
    if (authBearer?.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7);
        const decoded = this.jwtService.verify(
          token,
          this.configService.get('JWT_SECRET')
        ) as any;
        userId = decoded.uid;
      } catch {
        userId = null;
      }
    }
    const cart = await this.cartService.getCartByContext(
      sessionId,
      userId,
    );

    return await this.cartPreviewService.getUserCartPreview(
      cart.id,
    );
  }

  @UseGuards(JWTGuard)
  @Post('/checkout-calculate')
  async checkoutCaculate(@Body() dto: CheckoutCaculateDto, @Req() req: Request) {
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

      const cartId = await this.cartService.getCartByContext(sessionId, userId)

      return await this.cartPreviewService.checkoutCaculate(userId, cartId?.dataValues?.id, dto);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message)
    }
  }


}
