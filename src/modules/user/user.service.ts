import { User } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User) private readonly UserModel: typeof User,
        private readonly JWTService: JwtService
    ) { }

    async findByEmail(email: string) {
        return await this.UserModel.findOne({
            where: {
                email: email,
            }
        })
    }

    async validateLogin(loginData: LoginDto) {
        const alreadyUser = await this.findByEmail(loginData.email)
        if (!alreadyUser) throw new BadRequestException('Người dùng chưa tồn tại!')

        const matchesPassword = alreadyUser.comparePassword(loginData.password)
        if (!matchesPassword) throw new BadRequestException('Tài khoản hoặc khẩu không chính xác')
        const userRaw = alreadyUser.toJSON()

        return { uid: userRaw.id, role: userRaw.role }
    }

    async createGoogleUser(googleUser: any) {
        const newUser = new this.UserModel(googleUser)
        return await newUser.save()
    }

    async updateGoogleId(userId: string, googleId: string) {
        const updateGoogleId = await this.UserModel.update({ googleId }, { where: { id: userId } })


        return await this.UserModel.findOne({ where: { id: userId } });
    }

    async updateRefreshToken(userId: string, refreshToken: string) {
        await this.UserModel.update({ refreshToken }, { where: { id: userId } })

        return await this.UserModel.findOne({ where: { id: userId } });
    }

    async register(createUserDto: CreateUserDto) {
        const alreadyUser = await this.findByEmail(createUserDto.email)
        if (alreadyUser) throw new BadRequestException('Người dùng đã tồn tại!')
        const newUser = await this.UserModel.create(createUserDto as any)
        return {
            data: newUser.getUserDataWhithoutPassword(),
            message: "Create User SuccessFully!"
        }
    }

    async validateRefreshToken(id: number, refreshToken: string) {
        return await this.UserModel.findOne({
            where: {
                id: id,
                refreshToken: refreshToken
            }
        })
    }

    async removeRefreshToken(refreshToken: string) {
        return await this.UserModel.update({ refreshToken: "" }, { where: { refreshToken: refreshToken } })
    }
}
