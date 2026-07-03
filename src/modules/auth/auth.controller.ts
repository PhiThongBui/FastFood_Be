import { Body, Controller, Get, Param, Post, Put, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { Response, Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../user/dto/login.dto';
import { JWTGuard } from './guards/verifyjwt.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/ForgotPasswordDto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiOperation({ summary: 'ÄÄƒng nháº­p báº±ng email vÃ  máº­t kháº©u' })
  @ApiBody({
    type: LoginDto,
    description: 'ThÃ´ng tin Ä‘Äƒng nháº­p',
    examples: {
      user: {
        summary: 'TÃ i khoáº£n ngÆ°á»i dÃ¹ng',
        value: {
          email: 'tpbfptuniversity@gmail.com',
          password: 'tpbfptuniversity'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'ÄÄƒng nháº­p thÃ nh cÃ´ng' })
  @ApiResponse({ status: 401, description: 'Sai email hoáº·c máº­t kháº©u' })
  login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user, res);
  }


  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'ÄÄƒng nháº­p báº±ng google',
    description: 'API nÃ y sáº½ tá»± Ä‘á»™ng redirect ngÆ°á»i dÃ¹ng Ä‘áº¿n trang Ä‘Äƒng nháº­p Google Ä‘á»ƒ xÃ¡c thá»±c.',
  })
  @Get('/google')
  googleLogin(@Req() _req: Request) {
    // Passport sáº½ tá»± Ä‘á»™ng redirect Ä‘áº¿n Google
  }


  // Route callback tá»« Google
  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Xá»­ lÃ½ callback tá»« Google sau khi Ä‘Äƒng nháº­p',
    description:
      'Sau khi ngÆ°á»i dÃ¹ng Ä‘Äƒng nháº­p Google thÃ nh cÃ´ng, Google sáº½ gá»i láº¡i endpoint nÃ y. Há»‡ thá»‘ng sáº½ táº¡o hoáº·c xÃ¡c thá»±c tÃ i khoáº£n, rá»“i tráº£ vá» token + thÃ´ng tin user.',
  })
  async googleAuthRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Tráº£ vá» token vÃ  thÃ´ng tin user
    return await this.authService.googleLogin(req.user, res);
  }


  @Post('/refreshtoken')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'LÃ m má»›i Access Token báº±ng Refresh Token',
    description: `
      - API nÃ y dÃ¹ng Ä‘á»ƒ láº¥y **Access Token má»›i** khi token cÅ© háº¿t háº¡n.  
      - Cáº§n gá»­i kÃ¨m **refreshToken** trong cookie (HTTP Only).  
      - Náº¿u refreshToken há»£p lá»‡ vÃ  trÃ¹ng khá»›p vá»›i user, há»‡ thá»‘ng sáº½ tráº£ láº¡i Access Token má»›i.`,
  })
  RefreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refreshToken(req, res);
  }


  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'ÄÄƒng xuáº¥t, xÃ³a háº¿t token' })
  @Get('/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }

  
  @Post('/forgot-password')
  @ApiOperation({
    summary: 'QuÃªn máº­t kháº©u, Má»™t email Ä‘Æ°á»£c gá»­i tá»›i vá»›i link Ä‘á»ƒ ngÆ°á»i dÃ¹ng Ä‘á»ƒ reset máº­t kháº»u'
  })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassWord(dto.email);
  }


  @Post('/reset-password')
  @ApiOperation({ summary: 'Äáº·t láº¡i máº­t kháº©u ngÆ°á»i dÃ¹ng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'MÃ£ token Ä‘áº·t láº¡i máº­t kháº©u (gá»­i qua email)',
          example: 'b87b6f6a9c2e4f8f99b4ad1234567890abcdef12',
        },
        password: {
          type: 'string',
          description: 'Máº­t kháº©u má»›i (tá»‘i thiá»ƒu 8 kÃ½ tá»±)',
          example: 'NewPassword123!',
        },
      },
      required: ['token', 'password'],
    },
  })
  async resetPassword(
    @Body('password') password: string,
    @Body('token') token: string,
  ) {
    return this.authService.resetPassword(password, token);
  }


  @UseGuards(JWTGuard)
  @ApiBearerAuth('access-token')
  @Put('/change-password')
  @ApiOperation({ summary: 'Thay Ä‘á»•i máº­t kháº©u ngÆ°á»i dÃ¹ng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: { type: 'string', example: 'OldPass123!', description: 'Máº­t kháº©u hiá»‡n táº¡i' },
        newPassword: { type: 'string', example: 'NewPass456!', description: 'Máº­t kháº©u má»›i (tá»‘i thiá»ƒu 8 kÃ½ tá»±)' },
        confirmPassword: { type: 'string', example: 'NewPass456!', description: 'XÃ¡c nháº­n máº­t kháº©u má»›i' },
      },
      required: ['uid', 'oldPassword', 'newPassword', 'confirmPassword'],
    },
  })
  changePassword(@Body('oldPassword') oldPassword: string, @Body('newPassword') newPassword: string, @Body('confirmPassword') confirmPassword: string, @Req() req: Request) {
    let userId: number | null = null
    const authBearer = req.headers?.authorization
    if (authBearer && authBearer.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7)
        const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any
        userId = decoded.uid
      } catch (error: any) {
        userId = null
      }
    }
    if (!userId) {
      throw new UnauthorizedException('KhÃ´ng tÃ¬m tháº¥y userId trong token');
    }
    return this.authService.changePassword(userId, oldPassword, newPassword, confirmPassword);
  }
}
