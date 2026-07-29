import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { Address } from './address.model';
import { Reviews } from './reviews.model';
import { OrderItems } from './order-items.model';
import { KitchenTicket } from './kitchen-ticket.model';
import { TableSession } from './table-session.model';


export enum ORDERSTATUS {
    PENDING = 'Đang chờ',
    DELIVERED = 'Đã giao hàng',
    CANCELLED = 'Đã hủy',
    PREPARING = 'Đang chuẩn bị',
    READY = 'Sẵn sàng',
}

export enum PAYMENTMETHOD {
    CASH = 'Thanh toán khi nhận hàng',
    SEPAY = 'Chuyển khoản ngân hàng (SePay)'
}

export enum PAYMENTSTATUS {
    PAID = 'Đã thanh toán',
    FAILED = 'Thanh toán thất bại',
    PENDING = 'Chờ thanh toán',
    REFUNDED = 'Hoàn tiền'
}

export enum ORDERTYPE {
    DELIVERY = 'DELIVERY',
    DINE_IN = 'DINE_IN',
}

@Table
export class Order extends Model<Order> {
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING,
    })
    declare orderNumber: string;

    @Column({
        allowNull: false,
        defaultValue: ORDERTYPE.DELIVERY,
        type: DataType.ENUM(...Object.values(ORDERTYPE)),
    })
    declare orderType: ORDERTYPE;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(ORDERSTATUS)),
    })
    declare orderStatus: ORDERSTATUS;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(PAYMENTMETHOD)),
    })
    declare paymentMethod: PAYMENTMETHOD;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(PAYMENTSTATUS)),
    })
    declare paymentStatus: PAYMENTSTATUS;

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare subTotal: number;

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare deliveryFee: number;


    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare discount: number;


    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare finalTotal: number;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare notes: string | null;

    // ⭐ THÊM CÁC TRƯỜNG MỚI
    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare momoTransId: string | null;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare momoRequestId: string | null;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare paidAt: Date | null;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare cancelledReason: string | null;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare cancelledAt?: Date | null;
    //Relation

    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare userId: number | null

    @BelongsTo(() => User)
    user: User


    @ForeignKey(() => Address)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare addressId: number | null

    @BelongsTo(() => Address)
    address: Address | null

    @ForeignKey(() => TableSession)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare tableSessionId: number | null

    @BelongsTo(() => TableSession, 'tableSessionId')
    tableSession: TableSession | null

    @HasMany(() => Reviews, { constraints: false })
    review: Reviews

    @HasMany(() => OrderItems)
    orderItems: OrderItems

    @HasMany(() => KitchenTicket)
    kitchenTickets: KitchenTicket[]
}
