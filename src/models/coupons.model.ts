import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { UserCoupons } from './user-coupons.model';

export enum COUPONTYPE {
    FIXED = 'FIXED',
    PERCENT = 'PERCENT',
}

@Table
export class Coupons extends Model<Coupons> {
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING,
    })
    declare code: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare name: string;


    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare description: string;


    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(COUPONTYPE)),
    })
    declare type: COUPONTYPE;

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare value: number;


    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare minOrderAmount: number;

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    declare maxUsers: number;

    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare currentUsers: number;

    @Column({
        allowNull: false,
        type: DataType.DATE,
    })
    declare validFrom: Date;


    @Column({
        allowNull: false,
        type: DataType.DATE,
    })
    declare validTo: Date;

    @Column({
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean

    //relation

    @HasMany(() => UserCoupons, {
        onDelete: 'CASCADE',
        hooks: false
    })
    userCoupons: UserCoupons[]
}