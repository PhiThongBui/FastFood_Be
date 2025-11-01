import { BeforeValidate, BelongsTo, Column, DataType, ForeignKey, HasMany, Index, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { Order } from './order.model';
import { BadRequestException } from '@nestjs/common';

@Table
export class Address extends Model<Address> {
    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    recipientName: string; // <--- TÊN NGƯỜI NHẬN

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    recipientPhone: string; // <--- SỐ ĐIỆN THOẠI NGƯỜI NHẬN
    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    street: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    city: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    district: string;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    ward: string;

    @Column({
        allowNull: false,
        type: DataType.FLOAT,
    })
    longitude: number;

    @Column({
        allowNull: false,
        type: DataType.FLOAT,
    })
    latitude: number;


    @Column({
        defaultValue: false,
        type: DataType.BOOLEAN,
    })
    isDefault: boolean;

    @Index // Thêm index để tăng tốc độ truy vấn theo sessionId
    @Column({
        allowNull: true,
        type: DataType.STRING
    })
    sessionId: string | null;

    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    userId: number | null;


    @BelongsTo(() => User)
    user: User

    @HasMany(() => Order,{
        onDelete: 'CASCADE',
        hooks: false
    })
    orders: Order

    @BeforeValidate
    static validateCreateAddress(instance: Address) {        
        const hasSessionId = !!instance.dataValues.sessionId;
        const hasUserId = !!instance.dataValues.userId;
        if (!hasSessionId && !hasUserId) {
            throw new BadRequestException('Must have either sessionId or userId!');
        }
        if (hasSessionId && hasUserId) {
            throw new BadRequestException('Cannot have both sessionId and userId');
        }
    }
}