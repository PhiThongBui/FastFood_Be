import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly JwtService: JwtService
    ) { }

    async validateUser(loginData: LoginDto) {
        return await this.userService.validateLogin(loginData)
    }

    async login({ id, role }) {
        const accessToken = await this.JwtService.signAsync({ uid: id, role: role })

        return {
            message: "Login thành công",
            accessToken
        }
    }
}
