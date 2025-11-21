import { log } from 'node:console';
import { User } from '@/models';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Op } from 'sequelize';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { Sequelize } from 'sequelize-typescript';
import { GetAllUserDto, UserDto, UserResponseDto } from './dto/getAllUser.dto';
import { plainToClass } from 'class-transformer';
import { ResponseUserByIdDto } from './dto/getUserById.dto';
import * as crypto from 'crypto'
import { MailService } from '../mail/mail.service';
import { ResendRegistationDto, VerifyRegistationDto } from './dto/verifyRegistation.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User) private readonly UserModel: typeof User,
        private readonly JWTService: JwtService,
        private readonly transaction: Sequelize,
        private readonly mailService: MailService
    ) { }


    async findUserById(userId: number) {
        const user = await this.UserModel.findByPk(userId)
        return {
            message: "Get User SuccessFully! ",
            data: user
        }
    }

    async findByEmail(email: string) {
        return await this.UserModel.findOne({
            where: {
                email: email,
            }
        })
    }

    async validateLogin(loginData: LoginDto) {
        const alreadyUser = await this.findByEmail(loginData.email)
        if (!alreadyUser) throw new BadRequestException('Người dùng chưa tồn tại!');            
        if(!alreadyUser.dataValues.isEmailVerified) throw new BadRequestException('Email chưa được xác thực!')
        const matchesPassword = await alreadyUser.comparePassword(loginData.password)

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

    // Generate 6-digit OTP
    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async register(createUserDto: CreateUserDto) {
        const alreadyUser = await this.findByEmail(createUserDto.email)
        if (alreadyUser) throw new BadRequestException('Người dùng đã tồn tại!')

        const otp = this.generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        const newUser = await this.UserModel.create({
            ...createUserDto,
            passwordResetToken: hashedOtp,
            passwordResetExpires: otpExpires
        } as any)

        await this.mailService.sendVerificationEmail(createUserDto.email, createUserDto.name, otp);

        return {
            data: newUser.getUserProfile(),
            message: "Create User SuccessFully!"
        }
    }

    async verifyRegistation(data: VerifyRegistationDto) {
        const { otp, email } = data
        const transaction = await this.transaction.transaction();
        try {
            const user = await this.UserModel.findOne({
                where: {
                    email: email
                },
                transaction
            })

            if (!user) throw new BadRequestException('Người dùng chưa tồn tại!')
            if (user.dataValues.isEmailVerified) throw new BadRequestException('Email đã được xác thực!')
            if (user.dataValues.passwordResetExpires && user.dataValues.passwordResetExpires < Date.now()) throw new BadRequestException('OTP hằn chính xác!')
            const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

            if (user.dataValues.passwordResetToken !== hashedOtp) throw new BadRequestException('OTP không chính xác!')

            await user.update({
                isEmailVerified: true,
                passwordResetToken: null,
                passwordResetExpires: null
            }, { transaction })

            await transaction.commit();

            return {
                message: "Verify Registation SuccessFully!",
                data: user.getUserProfile()
            }

        } catch (error) {
            console.log(error);
            await transaction.rollback();
            throw error
        }
    }

    async resendVerificationEmail(data: ResendRegistationDto) {
        const { email } = data
        const transaction = await this.transaction.transaction();
        try {
            const user = await this.UserModel.findOne({
                where: {
                    email: email
                }
            })
            if (user?.dataValues.isEmailVerified) throw new BadRequestException('Email đã được xác thực!')
            const otp = this.generateOTP();
            const otpExpires = Date.now() + 5 * 60 * 1000;

            const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

            if (user) {
                await user.update({
                    passwordResetToken: hashedOtp,
                    passwordResetExpires: otpExpires
                }, { transaction })

                await this.mailService.sendVerificationEmail(email, user?.dataValues.name, otp);
            }

            return {
                message: "Resend Registation SuccessFully!",
                otp: otp,
                email: email
            }
        } catch (error) {
            console.log(error);
            await transaction.rollback();
            throw error
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

    async checkPwResetTokenAndExprised(passwordResetToken: string) {
        return await this.UserModel.findOne({
            where: {
                passwordResetToken: passwordResetToken,
                passwordResetExpires: {
                    [Op.gt]: Date.now()
                }
            }
        })
    }

    async getCurrentUser(userId: number) {
        const user = await this.UserModel.findByPk(userId);

        if (!user) {
            throw new NotFoundException('Người dùng không tồn tại');
        }
        // Trả về user data mà không có password
        return user.getUserProfile();
    }

    async updateProfile(data: UpdateProfileDto, userId: number) {
        const { name, email, phone, avatar } = data;
        const transaction = await this.transaction.transaction();
        try {
            if (Object.keys(data).length === 0) throw new BadRequestException('Vui lên nhập dữ liệu')
            const user = await this.UserModel.findByPk(userId, { transaction });

            if (!user) {
                throw new NotFoundException('Người dùng không tồn tại');
            }
            if (email && email.trim() !== user.email) {
                const alreadyUser = await this.UserModel.findOne({ where: { email }, transaction });
                if (alreadyUser) {
                    throw new BadRequestException('Email đã được sử dụng');
                }
            }
            if (phone && phone.trim() !== user.phone) {
                const alreadyUser = await this.UserModel.findOne({ where: { phone }, transaction });
                if (alreadyUser) {
                    throw new BadRequestException('Phone đã được sử dụng');
                }
            }

            const updates: Partial<User> = {};
            if (name) updates.name = name;
            if (email) updates.email = email;
            if (phone) updates.phone = phone;
            if (avatar) updates.avatar = avatar;

            // Object.assign(user, updates);
            // await user.save({ transaction });
            await user.update(updates, { transaction });
            await user.reload({ transaction });
            const updatedUser = user.getUserProfile();
            await transaction.commit();
            return {
                message: 'Updated user successfully',
                data: updatedUser
            }
        }

        catch (error) {
            console.log(error);
            await transaction.rollback();
            throw error
        }
    }

    async getUsers(data: GetAllUserDto): Promise<UserResponseDto> {
        const { page = 1, limit = 10, search, isActive = true } = data
        const transaction = await this.transaction.transaction();
        const offset = (page - 1) * limit
        const where: Record<string, any> = {}
        if (isActive !== undefined) where.isActive = isActive
        if (search) {
            (where as any)[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } }
            ]
        }
        try {
            const { count, rows: users } = await this.UserModel.findAndCountAll({
                where,
                limit,
                offset,
                transaction
            })
            const userData = users.map(user =>
                plainToClass(UserDto, user.get({ plain: true }), {
                    excludeExtraneousValues: true
                })
            );
            await transaction.commit();
            return {
                totalCount: count,
                pageIndex: page,
                pageSize: limit,
                data: userData,
            }
        } catch (error) {
            console.log(error);
            await transaction.rollback();
            throw error
        }
    }

    async findById(id: number): Promise<ResponseUserByIdDto> {
        const user = await this.UserModel.findByPk(id);

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng này')
        }

        const response = plainToClass(ResponseUserByIdDto, user.get({ plain: true }), {
            excludeExtraneousValues: true
        });
        return response
    }
}
