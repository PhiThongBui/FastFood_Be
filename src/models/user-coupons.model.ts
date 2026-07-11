import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { Coupons } from './coupons.model';

@Table
export class UserCoupons extends Model<UserCoupons> {
    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare claimedAt: Date | null;

    @Column({
        defaultValue: false,
        type: DataType.BOOLEAN,
    })
    declare isUsed: boolean;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare usedAt: Date | null;


    @ForeignKey(() => User)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare userId: number;

    @ForeignKey(() => Coupons)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare couponId: number

    @BelongsTo(() => User)
    user: User

    @BelongsTo(() => Coupons)
    coupon: Coupons
}
