import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { Coupons } from './coupons.model';

@Table
export class UserCoupons extends Model<UserCoupons> {
    @Column({
        defaultValue: false,
        type: DataType.BOOLEAN,
    })
    isUsed: boolean;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    usedAt: Date;


    @ForeignKey(() => User)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    userId: number;

    @ForeignKey(() => Coupons)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    couponId: number

    @BelongsTo(() => User)
    user: User

    @BelongsTo(() => Coupons)
    coupon: Coupons
}