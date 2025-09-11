import { log, time } from 'node:console';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Req, Res, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import e, { Response, Request, response } from 'express';
import * as crypto from 'crypto'
import * as bcrypt from 'bcryptjs'
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly JwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailerService: MailerService

    ) { }

    async validateUser(loginData: LoginDto) {
        return await this.userService.validateLogin(loginData)
    }

    async login({ uid, role }, response?: Response) {
        const accessToken = await this.JwtService.signAsync({ uid: uid, role: role }, {
            expiresIn: '1m'
        });
        const refreshToken = await this.JwtService.signAsync({ uid: uid, role: role }, {
            expiresIn: '7d'
        });

        await this.userService.updateRefreshToken(uid, refreshToken);

        // Nếu có response object, set cookie
        if (response) {
            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        return {
            message: 'Login successfully!!!',
            accessToken,
            refreshToken: response ? undefined : refreshToken // Không trả refreshToken nếu đã set cookie
        };
    }

    async refreshToken(req: Request, _res: Response) {
        const cookies = req.cookies;
        if (!cookies || !cookies?.refreshToken) {
            throw new UnauthorizedException('RefreshToken not found!');
        }

        const decode = await this.JwtService.verifyAsync(cookies.refreshToken, {
            secret: this.configService.get('JWT_SECRET')
        });

        const matchesRefreshToken = await this.userService.validateRefreshToken(decode.uid, cookies.refreshToken);
        if (!matchesRefreshToken) throw new UnauthorizedException('RefreshToken not matches!');

        const accessToken = await this.JwtService.signAsync({ uid: decode.uid, role: decode.role }, {
            expiresIn: '15m'
        });
        return {
            message: 'Refresh token completed!!!',
            accessToken
        };
    }

    async logout(@Req() req: Request, @Res({ passthrough: true }) response?: Response) {
        const cookies = req.cookies;

        if (!cookies || !cookies.refreshToken) throw new UnauthorizedException('RefreshToken not found!');

        await this.userService.removeRefreshToken(cookies.refreshToken);

        if (response) {
            response.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
            });
        }

        return {
            message: 'Logout completed!!!'
        }
    }

    async forgotPassWord(email: string) {
        const verifyEmail = await this.userService.findByEmail(email)

        if (!verifyEmail) throw new UnauthorizedException('Lỗi email forgot password!!!')

        const passwordChangeToken = verifyEmail.createResetPasswordToken()

        await verifyEmail.save()
        const frontEndURL = this.configService.get('FRONTEND_URL')
        const resetLink = `${frontEndURL}/reset-password/${passwordChangeToken}`

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: `Đặt lại mật khẩu - ${this.configService.get('APP_NAME')}`,
                template: 'reset-password',
                context: {
                    userName: verifyEmail?.dataValues?.name,
                    userEmail: email,
                    appName: this.configService.get('APP_NAME'),
                    resetLink: resetLink,
                    passwordChangeToken: passwordChangeToken,
                    expiryTime: 5,
                    supportEmail: this.configService.get('SUPPORT_EMAIL'),
                    companyAddress: this.configService.get('COMPANY_ADDRESS'),
                    companyPhone: this.configService.get('COMPANY_PHONE'),
                    currentYear: new Date().getFullYear()
                }
            })


            return {
                message: 'Email đặt lại mật khẩu đã thực hiện thành công!!!'
            }
        } catch (error) {
            console.log(error);
        }
    }

    async resetPassword(password: string, token: string) {

        const checkToken = crypto.createHash('sha256').update(token).digest('hex')

        const user = await this.userService.checkPwResetTokenAndExprised(checkToken)

        if (!user) throw new UnauthorizedException('Reset password token is wrong!!!')

        const hasedPassword = bcrypt.hashSync(password, 10)

        await user.update({
            password: hasedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
            passwordChangeAt:new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false })
        });

        return {
            message: 'Reset Password SuccessFully!!!'
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

    async googleLogin(googleUser: any, @Res({ passthrough: true }) response?: Response) {
        const { createdAt, updatedAt, password, ...rest } = googleUser
        const accessToken = await this.JwtService.signAsync({ uid: googleUser?.id, role: googleUser?.role })
        const refreshToken = await this.JwtService.signAsync({ uid: googleUser?.id, role: googleUser?.role })
        await this.userService.updateRefreshToken(googleUser.id, refreshToken)

        if (response) {
            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }
        return {
            message: "Login bằng google thành công",
            accessToken,
            user: rest
        };
    }
}
