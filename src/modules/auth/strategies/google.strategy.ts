import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthProvider } from '@/models/user.model';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService
    ) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID') as string,
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET') as string,
            callbackURL: configService.get('GOOGLE_CALLBACK_URL') as string,
            scope: ['email', 'profile'],
            passReqToCallback: false, // or false, depending on your needs
        });
    }
    // xử lí logic tìm  hoăc tao user

    async validate(_accessToken: string, _refreshToken: string, profile: any, callback: VerifyCallback): Promise<any> {
                
        const { id, displayName, emails, photos, provider } = profile;

        const user = {
            googleId: id,
            email: emails[0].value,
            name: displayName,
            avatar: photos[0].value,
            authProvider: provider || 'google' ,
            isActive: true
        }
        
        const userGoogle = await this.authService.validateGoogleUser(user);
        if(!userGoogle) {
            throw new BadRequestException('Không tìm thấy người dùng')
        }
        return callback(null, userGoogle);
    }
}