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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Thêm sản phẩm vào giỏ hàng',
    description: `
API hỗ trợ **2 loại thao tác**:

---

### 🔹 1. Mua món lẻ (Single Product)
Bắt buộc:
- productId
- productVariantId
- quantity

Tuỳ chọn:
- singleProductOptions: danh sách topping / nguyên liệu
  - ingredientId
  - quantity
  - type: ADD | REMOVE

---

### 🔹 2. Mua combo
Bắt buộc:
- comboId
- quantity
- selectedOptions

Trong đó mỗi selectedOption gồm:
- productId
- productVariantId
- ingredients (tuỳ chọn)
  - ingredientId
  - quantity
  - type: ADD | REMOVE
`
  })

  @ApiBody({
    type: CreateCartItemDto,
    examples: {

      'single-no-topping': {
        summary: '1. Món lẻ - Không topping',
        description: 'Mua 1 Pizza Margherita size M',
        value: {
          productId: 3,
          productVariantId: 5,
          quantity: 1
        }
      },

      'single-with-topping': {
        summary: '2. Món lẻ - Có topping',
        description: 'Mua 2 Pizza Pepperoni size L, thêm phô mai, bớt hành',
        value: {
          productId: 5,
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

      'combo-basic': {
        summary: '3. Combo - Không customize',
        description: 'Combo Sinh Viên',
        value: {
          comboId: 1,
          quantity: 1,
          selectedOptions: [
            {
              productId: 3,
              productVariantId: 5
            },
            {
              productId: 10,
              productVariantId: 12
            }
          ]
        }
      },

      'combo-customize': {
        summary: '4. Combo - Có customize',
        description: 'Combo Gia Đình, Pizza thêm topping',
        value: {
          comboId: 2,
          quantity: 2,
          selectedOptions: [
            {
              productId: 7,
              productVariantId: 15,
              ingredients: [
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
            },
            {
              productId: 10,
              productVariantId: 13
            }
          ]
        }
      }
    }
  })

  @ApiResponse({
    status: 201,
    description: 'Thêm vào giỏ hàng thành công',
    schema: {
      example: {
        message: 'Thêm vào giỏ hàng thành công!',
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
    description: 'Dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'Thiếu thông tin sản phẩm!',
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
      } catch (error) {
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
  async deleteCartItem(@Param('cartItemId') cartItemId: number) {
    return await this.cartItemService.deleteCartItem(cartItemId)
  }

  @Get('/mergecart')
  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Đồng bộ giỏ hàng từ guest sang user',
    description: `
**Mục đích:** Khi user login, hợp nhất giỏ hàng khách (guest cart) vào giỏ hàng user.

**Quy trình xử lý:**

**1. Món trùng khớp (MERGE)**
- Nếu item đã tồn tại trong giỏ user → Cộng dồn số lượng
- Với món lẻ: Cộng dồn cả số lượng topping
- Sau đó xóa item khỏi guest cart

**2. Món chưa có (MOVE)**
- Nếu item chưa có trong giỏ user → Di chuyển sang giỏ user
- Giữ nguyên toàn bộ thông tin (quantity, ingredients, selectedOptions)

**3. Dọn dẹp**
- Xóa guest cart sau khi đã xử lý hết items

**Lưu ý:**
- Yêu cầu đăng nhập (Bearer Token)
- SessionId tự động lấy từ cookie
- Tự động phát hiện và xử lý cả món lẻ và combo
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Đồng bộ thành công',
    schema: {
      example: {
        message: 'Đồng bộ giỏ hàng thành công!'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Không có giỏ hàng guest',
    schema: {
      example: {
        message: 'Không có giỏ hàng khách để merge.'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập',
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
      } catch (error) {
        userId = null
      }
    }
    const cartId = await this.cartService.getCartByContext(sessionId, userId, transaction)

    return await this.cartItemService.getCartItemByCartId(cartId?.dataValues?.id, transaction)

  }
}
