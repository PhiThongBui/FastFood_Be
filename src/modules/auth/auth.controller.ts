import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(@Body() dataLogin: LoginDto){
    return this.authService.validateUser(dataLogin)
  }
}
