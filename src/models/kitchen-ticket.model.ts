import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Order } from './order.model';
import { OrderItems } from './order-items.model';
import { TableSession } from './table-session.model';
import { User } from './user.model';

export enum KITCHEN_TICKET_SOURCE {
    QR = 'QR',
    STAFF = 'STAFF',
}

export enum KITCHEN_TICKET_STATUS {
    NEW = 'NEW',
    PREPARING = 'PREPARING',
    READY = 'READY',
    SERVED = 'SERVED',
    CANCELLED = 'CANCELLED',
}

@Table
export class KitchenTicket extends Model<KitchenTicket> {
    @ForeignKey(() => TableSession)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare tableSessionId: number;

    @ForeignKey(() => Order)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare orderId: number;

    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare createdByUserId: number | null;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare ticketNumber: string;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(KITCHEN_TICKET_SOURCE)),
    })
    declare source: KITCHEN_TICKET_SOURCE;

    @Column({
        allowNull: false,
        defaultValue: KITCHEN_TICKET_STATUS.NEW,
        type: DataType.ENUM(...Object.values(KITCHEN_TICKET_STATUS)),
    })
    declare status: KITCHEN_TICKET_STATUS;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare notes: string | null;

    @BelongsTo(() => TableSession)
    tableSession!: TableSession;

    @BelongsTo(() => Order)
    order!: Order;

    @BelongsTo(() => User)
    createdBy!: User | null;

    @HasMany(() => OrderItems)
    orderItems!: OrderItems[];
}
