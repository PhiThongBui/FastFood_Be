import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import e from 'express';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly JwtService: JwtService,

    ) { }

    async validateUser(loginData: LoginDto) {
        return await this.userService.validateLogin(loginData)
    }

    async login({ uid, role }) {

        const accessToken = await this.JwtService.signAsync({ uid: uid, role: role })
        const refreshToken = await this.JwtService.signAsync({ uid: uid, role: role })
        
        await this.userService.updateRefreshToken(uid, refreshToken)
        return {
            message: "Login thành công",
            accessToken
        }
    }
    async validateGoogleUser(googleUser: any) {
        let user = await this.userService.findByEmail(googleUser.email)
        if (!user) {
            user = await this.userService.createGoogleUser(googleUser)
        } else {
            if (!user.googleId) {
                user = await this.userService.updateGoogleId(user.id, googleUser.googleId)
            }
        }
        return user?.toJSON()
    }

    async googleLogin(googleUser: any) {
        const { createdAt, updatedAt, password, ...rest } = googleUser
        const accessToken = await this.JwtService.signAsync({ uid: googleUser?.id, role: googleUser?.role })
        const refreshToken = await this.JwtService.signAsync({ uid: googleUser?.id, role: googleUser?.role })
        await this.userService.updateRefreshToken(googleUser.id, refreshToken)
        return {
            message: "Google login thành công",
            accessToken,
            user: rest
        };
    }
}
