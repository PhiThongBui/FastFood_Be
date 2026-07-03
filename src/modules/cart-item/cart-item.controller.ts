import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.ts';
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
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'ThÃªm sáº£n pháº©m vÃ o giá» hÃ ng',
    description: `
API há»— trá»£ **3 loáº¡i thao tÃ¡c chÃ­nh**:

---

### ðŸ”¹ 1. Mua mÃ³n láº» (Single Product)
Báº¯t buá»™c:
- productId
- productVariantId
- quantity

Tuá»³ chá»n:
- singleProductOptions: danh sÃ¡ch topping / nguyÃªn liá»‡u

---

### ðŸ”¹ 2. Mua combo (Tuá»³ chá»‰nh - Customize)
Báº¯t buá»™c:
- comboId
- quantity
- comboOptions (Danh sÃ¡ch cÃ¡c mÃ³n khÃ¡ch chá»n cá»¥ thá»ƒ)

---

### ðŸ”¹ 3. Mua combo (ThÃªm nhanh - Quick Add)
Báº¯t buá»™c:
- comboId
- quantity

**LÆ°u Ã½:** KhÃ´ng truyá»n \`comboOptions\`. Há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng láº¥y danh sÃ¡ch mÃ³n máº·c Ä‘á»‹nh Ä‘Æ°á»£c cáº¥u hÃ¬nh trong Combo.
`
  })
  @ApiBody({
    type: CreateCartItemDto,
    examples: {

      'single-no-topping': {
        summary: '1. MÃ³n láº» - KhÃ´ng topping',
        description: 'Mua 1 Pizza Margherita size M',
        value: {
          productId: 1,
          productVariantId: 5,
          quantity: 1
        }
      },

      'single-with-topping': {
        summary: '2. MÃ³n láº» - CÃ³ topping',
        description: 'Mua 2 Pizza Pepperoni size L, thÃªm phÃ´ mai, bá»›t hÃ nh',
        value: {
          productId: 2,
          productVariantId: 8,
          quantity: 1,
          singleProductOptions: [
            {
              ingredientId: 1,
              quantity: 1,
              type: 'ADD'
            },
            {
              ingredientId: 4,
              quantity: 1,
              type: 'REMOVE'
            }
          ]
        }
      },

      'combo-customize': {
        summary: '3. Combo - CÃ³ customize (User chá»n mÃ³n)',
        description: 'Combo Gia ÄÃ¬nh, KhÃ¡ch Ä‘á»•i sang Pizza Háº£i Sáº£n vÃ  thÃªm topping',
        value: {
          comboId: 2,
          quantity: 1,
          comboOptions: [
            {
              comboItemId: 4,
              slotIndex: 0,
              productId: 3,
              productVariantId: 15,
              ingredients: [
                {
                  ingredientId: 1,
                  quantity: 1,
                  type: 'ADD'
                }
              ]
            },
            {
              comboItemId: 5,
              slotIndex: 0,
              productId: 4,
              productVariantId: 23
            }
          ]
        }
      },

      // ðŸ”¥ TRÆ¯á»œNG Há»¢P Má»šI Báº N Cáº¦N á»ž ÄÃ‚Y
      'combo-quick-add': {
        summary: '4. Combo - ThÃªm nhanh (Máº·c Ä‘á»‹nh)',
        description: 'Chá»‰ gá»­i comboId. Há»‡ thá»‘ng tá»± láº¥y cÃ¡c mÃ³n máº·c Ä‘á»‹nh (VD: Combo Pizza BÃ² + Coke -> Tá»± thÃªm 1 Pizza BÃ², 1 Coke)',
        value: {
          comboId: 1,
          quantity: 1
          // KhÃ´ng gá»­i comboOptions
        }
      }
    }
  })

  @ApiResponse({
    status: 201,
    description: 'ThÃªm vÃ o giá» hÃ ng thÃ nh cÃ´ng',
    schema: {
      example: {
        message: 'ThÃªm vÃ o giá» hÃ ng thÃ nh cÃ´ng!',
        data: {
          id: 123,
          cartId: 1,
          productId: 3,
          productVariantId: 5,
          quantity: 1,
          createdAt: '2025-12-16T04:17:35.592Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dá»¯ liá»‡u khÃ´ng há»£p lá»‡',
    schema: {
      example: {
        statusCode: 400,
        message: 'Thiáº¿u thÃ´ng tin sáº£n pháº©m!',
        error: 'Bad Gateway'
      }
    }
  })
  async addToCart(
    @Body() dataAdd: CreateCartItemDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    let sessionId = Helper.getSessionIdFromRequest(req);
    let userId: number | null = null;

    const authHeader = req.headers?.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.JWTservice.verify(token, this.configService.get('JWT_SECRET')) as any;
        userId = decoded.uid;
      } catch (error: any) {
        userId = null;
      }
    }

    if (!userId && !sessionId) {
      sessionId = Helper.generateSessionId();
      Helper.setSessionCookie(sessionId, res);
    }

    return await this.cartItemService.addToCart({
      ...dataAdd,
      userId,
      sessionId
    } as AddToCartParams);
  }

  @Patch('/:cartItemId/quantity')
  async updateQuantity(
    @Param('cartItemId') cartItemId: number,
    @Body('action') action: string
  ) {
    return await this.cartItemService.increOrDecreQuantity(cartItemId, action as actionUpdateCartItem)
  }

  @Delete('/:cartItemId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'XoÃ¡ sáº£n pháº©m khá»i giá» hÃ ng',
    description: 'XoÃ¡ má»™t item khá»i giá» hÃ ng dá»±a trÃªn cartItemId. Há»— trá»£ cáº£ user Ä‘Ã£ Ä‘Äƒng nháº­p vÃ  guest.'
  })
  @ApiParam({
    name: 'cartItemId',
    description: 'ID cá»§a item trong giá» hÃ ng',
    required: true,
    type: Number
  })
  async deleteCartItem(
    @Param('cartItemId') cartItemId: number,
    @Req() req: Request,
    @Res({ passthrough: true }) _res: Response
  ) {
    const sessionId = Helper.getSessionIdFromRequest(req);
    let userId: number | null = null;

    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.JWTservice.verify(
          token,
          this.configService.get('JWT_SECRET')
        ) as any;
        userId = decoded.uid;
      } catch (error: any) {
        userId = null;
      }
    }

    return await this.cartItemService.deleteCartItem(cartItemId, userId, sessionId)
  }

  @Get('/mergecart')
  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Äá»“ng bá»™ giá» hÃ ng tá»« guest sang user',
    description: `
**Má»¥c Ä‘Ã­ch:** Khi user login, há»£p nháº¥t giá» hÃ ng khÃ¡ch (guest cart) vÃ o giá» hÃ ng user.

**Quy trÃ¬nh xá»­ lÃ½:**

**1. MÃ³n trÃ¹ng khá»›p (MERGE)**
- Náº¿u item Ä‘Ã£ tá»“n táº¡i trong giá» user â†’ Cá»™ng dá»“n sá»‘ lÆ°á»£ng
- Vá»›i mÃ³n láº»: Cá»™ng dá»“n cáº£ sá»‘ lÆ°á»£ng topping
- Sau Ä‘Ã³ xÃ³a item khá»i guest cart

**2. MÃ³n chÆ°a cÃ³ (MOVE)**
- Náº¿u item chÆ°a cÃ³ trong giá» user â†’ Di chuyá»ƒn sang giá» user
- Giá»¯ nguyÃªn toÃ n bá»™ thÃ´ng tin (quantity, ingredients, comboOptions)

**3. Dá»n dáº¹p**
- XÃ³a guest cart sau khi Ä‘Ã£ xá»­ lÃ½ háº¿t items

**LÆ°u Ã½:**
- YÃªu cáº§u Ä‘Äƒng nháº­p (Bearer Token)
- SessionId tá»± Ä‘á»™ng láº¥y tá»« cookie
- Tá»± Ä‘á»™ng phÃ¡t hiá»‡n vÃ  xá»­ lÃ½ cáº£ mÃ³n láº» vÃ  combo
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Äá»“ng bá»™ thÃ nh cÃ´ng',
    schema: {
      example: {
        message: 'Äá»“ng bá»™ giá» hÃ ng thÃ nh cÃ´ng!'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'KhÃ´ng cÃ³ giá» hÃ ng guest',
    schema: {
      example: {
        message: 'KhÃ´ng cÃ³ giá» hÃ ng khÃ¡ch Ä‘á»ƒ merge.'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'ChÆ°a Ä‘Äƒng nháº­p',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async mergeCart(@Req() req: Request, @Res({ passthrough: true }) _res: Response) {
    const sessionId = Helper.getSessionIdFromRequest(req);
    const userId = (req.user as { uid: number; role: string }).uid;
    return await this.cartItemService.mergerCart(sessionId, userId);
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
      } catch (error: any) {
        userId = null
      }
    }
    const cartId = await this.cartService.getCartByContext(sessionId, userId, transaction)

    return await this.cartItemService.getCartItemByCartId(cartId?.dataValues?.id, transaction)

  }


  @Put('/items/:cartItemId')
  @ApiOperation({
    summary: 'Cáº­p nháº­t cart item',
    description: 'Cho phÃ©p cáº­p nháº­t quantity, variant, ingredients hoáº·c comboOptions cá»§a combo'
  })
  @ApiParam({
    name: 'cartItemId',
    type: Number,
    example: 123
  })
  @ApiBody({
    type: UpdateCartItemDto,
    examples: {
      'update-combo': {
        summary: 'Update comboOptions',
        value: {
          type: 'COMBO',
          comboOptions: [
            {
              comboItemId: 4,
              slotIndex: 0,
              productId: 8,
              productVariantId: 30,
              ingredients: [
                {
                  ingredientId: 3,
                  quantity: 1,
                  type: 'ADD'
                }
              ]
            },
            {
              comboItemId: 5,
              slotIndex: 0,
              productId: 11,
              productVariantId: 35
            }
          ]
        }
      },
      'update-quantity-only': {
        summary: 'Chá»‰ update sá»‘ lÆ°á»£ng',
        value: {
          quantity: 3
        }
      },
      'update-single-pizza': {
        summary: 'Update mÃ³n láº» (variant + ingredients)',
        value: {
          productVariantId: 8,
          type: 'SINGLE',
          singleProductOptions: [
            {
              ingredientId: 1,
              quantity: 2,
              type: 'ADD'
            }
          ]
        }
      }
    }
  })
  async updateCartItem(
    @Param('cartItemId') cartItemId: number,
    @Body() updateDto: UpdateCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) _res: Response
  ) {
    const sessionId = Helper.getSessionIdFromRequest(req);
    let userId: number | null = null;

    const authHeader = req.headers?.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.JWTservice.verify(
          token,
          this.configService.get('JWT_SECRET')
        ) as any;
        userId = decoded.uid;
      } catch (error: any) {
        userId = null;
      }
    }

    return await this.cartItemService.updateCartItem(
      cartItemId,
      updateDto,
      userId,
      sessionId
    );
  }
}
