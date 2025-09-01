import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from './guards/local.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleAuthGuard } from './guards/google.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  login(@Req() req: any) {    
    return this.authService.login(req.user)
  }

  @UseGuards(GoogleAuthGuard)
  @Get('/google')
  googleLogin(@Req() _req: any) {
    // Passport sẽ tự động redirect đến Google
  }


  // Route callback từ Google
  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: any) {    
    // Trả về token và thông tin user
    return await this.authService.googleLogin(req.user)
  }
}
