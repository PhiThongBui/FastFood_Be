import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService
    ){}

    async validateUser(loginData:LoginDto){
        return await this.userService.validateLogin(loginData)
    }
}
