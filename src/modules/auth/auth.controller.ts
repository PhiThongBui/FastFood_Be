import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user, res);
  }


  @UseGuards(GoogleAuthGuard)
  @Get('/google')
  googleLogin(@Req() _req: Request) {
    // Passport sẽ tự động redirect đến Google
  }


  // Route callback từ Google
  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Trả về token và thông tin user
    return await this.authService.googleLogin(req.user, res);
  }


  @Post('/refreshtoken')
  RefreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refreshToken(req, res);
  }

  @Get('/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }
}
