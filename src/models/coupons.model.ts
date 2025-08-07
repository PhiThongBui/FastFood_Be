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
    code: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    name: string;


    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    description: string;


    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(COUPONTYPE)),
    })
    type: COUPONTYPE;

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    value: number;


    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    minOrderAmount: number;

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    maxUsers: number;

    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    currentUsers: number;

    @Column({
        allowNull: false,
        type: DataType.DATE,
    })
    validFrom: Date;


    @Column({
        allowNull: false,
        type: DataType.DATE,
    })
    validTo: Date;

    @Column({
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    isActive: boolean

    //relation

    @HasMany(() => UserCoupons)
    userCoupons: UserCoupons[]
}