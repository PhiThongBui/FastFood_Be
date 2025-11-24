import { BeforeBulkUpdate, BeforeUpdate, BeforeValidate, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Address } from './address.model';
import { Order } from './order.model';
import { Carts } from './carts.model';
import { UserCoupons } from './user-coupons.model';
import { Reviews } from './reviews.model';
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { CreateUserDto } from '@/modules/user/dto/register.dto';
import { LoginDto } from '@/modules/user/dto/login.dto';
import { Col } from 'sequelize/types/utils';

export enum ENUMROLE {
    ADMIN = 'ADMIN',
    User = 'USER',
}

export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
}

@Table
export class User extends Model<User> {
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING,
    })
    email: string;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    password: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    name: string;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    avatar: string;

    @Column({
        unique: true,
        allowNull: true,
        type: DataType.STRING,
    })
    phone: string;

    @Column({
        allowNull: false,
        defaultValue: ENUMROLE.User,
        type: DataType.ENUM(...Object.values(ENUMROLE)),
    })
    role: ENUMROLE;


    @Column({
        allowNull: false,
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    isActive: boolean;

    @Column({
        allowNull: true,
        type: DataType.STRING,
        unique: true
    })
    googleId: string


    @Column({
        allowNull: true,
        type: DataType.ENUM(...Object.values(AuthProvider)),
        defaultValue: AuthProvider.LOCAL
    })
    authProvider: AuthProvider

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    refreshToken: string

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    passwordResetToken: string | null


    @Column({
        allowNull: true,
        type: DataType.BIGINT,
    })
    passwordResetExpires: number | null

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    passwordChangeAt: string | null

    @Column({
        allowNull: false,
        defaultValue: false,
        type: DataType.BOOLEAN
    })
    isEmailVerified: boolean

    
    @HasMany(() => Address, {
        onDelete: 'CASCADE',
        hooks: false
    })
    addresses: Address[]

    @HasMany(() => Order, {
        onDelete: 'CASCADE',
        hooks: false
    })
    orders: Order[]
    //

    @HasMany(() => Carts, {
        onDelete: 'CASCADE',
        hooks: false
    })
    carts: Carts[]

    @HasMany(() => UserCoupons, {
        onDelete: 'CASCADE',
        hooks: false
    })
    userCoupons: UserCoupons[]

    @HasMany(() => Reviews, {
        onDelete: 'CASCADE',
        hooks: false
    })
    reviews: Reviews[]



    @BeforeValidate
    static hashPassword(userData: User) {
        const password = userData.dataValues.password
        if (userData.isNewRecord && password) {
            const hashPassword = bcrypt.hashSync(password, 10)
            userData.setDataValue('password', hashPassword)
        }
    }


    comparePassword(password: string) {
        const passwordInDB = this.get('password')
        return bcrypt.compare(password, passwordInDB)
    }

    getUserDataWhithoutPassword() {
        const { password, ...user } = this.get({ plain: true })
        return user
    }

    getUserProfile() {
        const { password, refreshToken, passwordResetToken, passwordResetExpires, passwordChangeAt, ...user } = this.get({ plain: true })
        return user
    }

    createResetPasswordToken() {
        const resetToken = crypto.randomBytes(32).toString("hex")

        const passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")

        const passwordResetExpires = Date.now() + 5 * 60 * 1000

        this.setDataValue("passwordResetToken", passwordResetToken)
        this.setDataValue("passwordResetExpires", passwordResetExpires)

        return resetToken
    }
}