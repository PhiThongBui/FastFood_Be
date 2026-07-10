import { Body, Controller, Get, Post, Put, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { Response, Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  @ApiBody({
    type: LoginDto,
    description: 'Thông tin đăng nhập',
    examples: {
      user: {
        summary: 'Tài khoản người dùng',
        value: {
          email: 'tpbfptuniversity@gmail.com',
          password: 'tpbfptuniversity',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu' })
  login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user, res);
  }

  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Đăng nhập bằng Google',
    description: 'API này sẽ tự động redirect người dùng đến trang đăng nhập Google để xác thực.',
  })
  @Get('/google')
  googleLogin(@Req() _req: Request) {
    // Passport sẽ tự động redirect đến Google
  }

  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Xử lý callback từ Google sau khi đăng nhập',
    description:
      'Sau khi người dùng đăng nhập Google thành công, hệ thống tạo hoặc xác thực tài khoản rồi redirect về frontend kèm access token.',
  })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const payload = await this.authService.googleLogin(req.user, res);
    const frontEndURL = this.configService.get('FRONTEND_URL');

    if (!frontEndURL) {
      return res.json(payload);
    }

    const redirectUrl = new URL('/auth/google/callback', frontEndURL);
    redirectUrl.searchParams.set('accessToken', payload.accessToken);
    redirectUrl.searchParams.set('message', payload.message);

    return res.redirect(redirectUrl.toString());
  }

  @Post('/refreshtoken')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Làm mới Access Token bằng Refresh Token',
    description: `
      - API này dùng để lấy **Access Token mới** khi token cũ hết hạn.
      - Cần gửi kèm **refreshToken** trong cookie (HTTP Only).
      - Nếu refreshToken hợp lệ và trùng khớp với user, hệ thống sẽ trả lại Access Token mới.
    `,
  })
  RefreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refreshToken(req, res);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Đăng xuất, xóa hết token' })
  @Get('/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }

  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Quên mật khẩu, một email được gửi tới với link để người dùng reset mật khẩu',
  })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassWord(dto.email);
  }

  @Post('/reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu người dùng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Mã token đặt lại mật khẩu (gửi qua email)',
          example: 'b87b6f6a9c2e4f8f99b4ad1234567890abcdef12',
        },
        password: {
          type: 'string',
          description: 'Mật khẩu mới (tối thiểu 8 ký tự)',
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
  @ApiOperation({ summary: 'Thay đổi mật khẩu người dùng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: {
          type: 'string',
          example: 'OldPass123!',
          description: 'Mật khẩu hiện tại',
        },
        newPassword: {
          type: 'string',
          example: 'NewPass456!',
          description: 'Mật khẩu mới (tối thiểu 8 ký tự)',
        },
        confirmPassword: {
          type: 'string',
          example: 'NewPass456!',
          description: 'Xác nhận mật khẩu mới',
        },
      },
      required: ['uid', 'oldPassword', 'newPassword', 'confirmPassword'],
    },
  })
  changePassword(
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
    @Body('confirmPassword') confirmPassword: string,
    @Req() req: Request
  ) {
    let userId: number | null = null;
    const authBearer = req.headers?.authorization;
    if (authBearer && authBearer.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7);
        const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any;
        userId = decoded.uid;
      } catch (error: any) {
        userId = null;
      }
    }
    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy userId trong token');
    }
    return this.authService.changePassword(userId, oldPassword, newPassword, confirmPassword);
  }
}
