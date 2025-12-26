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
    declare email: string;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare password: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare name: string;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare avatar: string;

    @Column({
        unique: true,
        allowNull: true,
        type: DataType.STRING,
    })
    declare phone: string;

    @Column({
        allowNull: false,
        defaultValue: ENUMROLE.User,
        type: DataType.ENUM(...Object.values(ENUMROLE)),
    })
    declare role: ENUMROLE;


    @Column({
        allowNull: false,
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;

    @Column({
        allowNull: true,
        type: DataType.STRING,
        unique: true
    })
    declare googleId: string


    @Column({
        allowNull: true,
        type: DataType.ENUM(...Object.values(AuthProvider)),
        defaultValue: AuthProvider.LOCAL
    })
    declare authProvider: AuthProvider

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare refreshToken: string

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare passwordResetToken: string | null


    @Column({
        allowNull: true,
        type: DataType.BIGINT,
    })
    declare passwordResetExpires: number | null

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare passwordChangeAt: string | null

    @Column({
        allowNull: false,
        defaultValue: false,
        type: DataType.BOOLEAN
    })
    declare isEmailVerified: boolean


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