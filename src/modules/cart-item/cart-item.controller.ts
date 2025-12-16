import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto } from './dto/cart-item.dto';
import { Response, Request } from 'express';
import { GetUser } from '@/common/decorators/user.decorator';
import { Helper } from '@/utils/helper';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { User } from '@/models';
import { actionUpdateCartItem } from './types/cartItem.type';
import { CartService } from '../cart/cart.service';
import { Sequelize } from 'sequelize-typescript';
import { ApiBearerAuth } from '@nestjs/swagger';
interface AddToCartParams extends CreateCartItemDto {
  userId?: number;
  sessionId?: string;
}
@Controller('cart-item')
export class CartItemController {
  constructor(
    private readonly cartItemService: CartItemService,
    private readonly cartService: CartService,
    private readonly JWTservice: JwtService,
    private readonly configService: ConfigService,
    private readonly transaction: Sequelize
  ) { }

  @Post('/addtocart')
  async addToCart(
    @Body() dataAdd: CreateCartItemDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    // @GetUser('uid') userId: number
  ) {
    let sessionId = Helper.getSessionIdFromRequest(req)

    let userId: number | null = null;

    const authHeader = req.headers?.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.JWTservice.verify(token, this.configService.get('JWT_SECRET')) as any;
        userId = decoded.uid;
      } catch (error) {
        // Token invalid hoặc expired, treat as guest
        userId = null;
      }
    }
    if (!userId && !sessionId) {
      sessionId = Helper.generateSessionId()
      Helper.setSessionCookie(sessionId, res)
    }

    return await this.cartItemService.addToCart({
      ...dataAdd,
      userId,
      sessionId
    } as AddToCartParams)

  }

  @Patch('/:cartItemId/quantity')
  async updateQuantity(
    @Param('cartItemId') cartItemId: number,
    @Body('action') action: string
  ) {
    return await this.cartItemService.increOrDecreQuantity(cartItemId, action as actionUpdateCartItem)
  }

  @Delete('/:cartItemId')
  async deleteCartItem(@Param('cartItemId') cartItemId: number) {
    return await this.cartItemService.deleteCartItem(cartItemId)
  }

  @Get('/mergecart')
  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  async mergeCart(@Req() req: Request, @Res({ passthrough: true }) _res: Response) {

    const sessionId = Helper.getSessionIdFromRequest(req)
    const userId = (req.user as { uid: number; role: string }).uid;
    return await this.cartItemService.mergerCart(sessionId, userId)
  }

  @Get('/get-cartitems')
  async getCartItemsByCartId
    (@Req() req: Request,
    ) {
    const transaction = await this.transaction.transaction()
    const sessionId = Helper.getSessionIdFromRequest(req)
    let userId: number | null = null
    const authBearer = req.headers?.authorization
    if (authBearer && authBearer.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7)
        const decoded = this.JWTservice.verify(token, this.configService.get('JWT_SECRET')) as any
        userId = decoded.uid
      } catch (error) {
        userId = null
      }
    }
    const cartId = await this.cartService.getCartByContext(sessionId, userId, transaction)

    return await this.cartItemService.getCartItemByCartId(cartId?.dataValues?.id, transaction)

  }
}
