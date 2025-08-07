import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { Address } from './address.model';
import { Reviews } from './reviews.model';
import { OrderItems } from './order-items.model';


export enum ORDERSTATUS {
    PENDING = 'Đang chờ',
    DELIVERED = 'Đã giao hàng',
    CANCELLED = 'Đã hủy',
    CONFIRMED = 'Đã xác nhận',
    PREPARING = 'Đang chuẩn bị',
    READY = 'Sẵn sàng',
}

export enum PAYMENTMETHOD {
    CASH = 'Thanh toán khi nhận hàng',
    ONLINE = 'Thanh toán online'
}

export enum PAYMENTSTATUS {
    PAID = 'Đã thanh toán',
    FAILED = 'Thanh toán thất bại',
    PENDING = 'Chờ thanh toán',
    REFUNDED = 'Hoàn tiền'
}

@Table
export class Order extends Model<Order> {
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING,
    })
    orderNumber: string;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(ORDERSTATUS)),
    })
    orderStatus: ORDERSTATUS;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(PAYMENTMETHOD)),
    })
    paymentMethod: PAYMENTMETHOD;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(PAYMENTSTATUS)),
    })
    paymentStatus: PAYMENTSTATUS;

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    subTotal: number;

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    deliveryFee: number;


    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    discount: number;


    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    total: number;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    notes: string;


    //Relation

    @ForeignKey(() => User)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    userId: number

    @BelongsTo(() => User)
    user: User


    @ForeignKey(() => Address)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    AddressId: number

    @BelongsTo(() => Address)
    address: Address

    @HasMany(() => Reviews)
    review: Reviews

    @HasMany(() => OrderItems)
    orderItems: OrderItems
}