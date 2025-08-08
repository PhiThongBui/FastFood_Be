
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/user/dto/login.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'email'
        });
    }
    async validate(email: string, password: string): Promise<any> {
        const loginDto: LoginDto = { email, password }
        return await this.authService.validateUser(loginDto);
    }
}
