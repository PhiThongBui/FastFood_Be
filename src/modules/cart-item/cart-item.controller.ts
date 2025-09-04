import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto } from './dto/cart-item.dto';
import { Response, Request } from 'express';
import { GetUser } from '@/common/decorators/user.decorator';
import { Helper } from '@/utils/helper';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { User } from '@/models';

@Controller('cart-item')
export class CartItemController {
  constructor(
    private readonly cartItemService: CartItemService,
    private readonly JWTservice: JwtService,
    private readonly configService: ConfigService
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
    console.log("authHeader", authHeader);

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
    } as CreateCartItemDto)

  }

  @Get('/mergecart')
  @UseGuards(JWTGuard)
  async mergeCart(@Req() req: Request, @Res({ passthrough: true }) _res: Response) {

    const sessionId = Helper.getSessionIdFromRequest(req)
    const userId = (req.user as { uid: number; role: string }).uid;    
    return await this.cartItemService.mergerCart(sessionId, userId)
  }


}
