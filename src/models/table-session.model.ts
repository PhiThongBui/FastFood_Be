import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Carts } from './carts.model';
import { DiningTable } from './dining-table.model';
import { KitchenTicket } from './kitchen-ticket.model';
import { Order } from './order.model';
import { User } from './user.model';

export enum TABLE_SESSION_STATUS {
    OPEN = 'OPEN',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
}

@Table
export class TableSession extends Model<TableSession> {
    @ForeignKey(() => DiningTable)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare tableId: number;

    @ForeignKey(() => Carts)
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.INTEGER,
    })
    declare cartId: number;

    @ForeignKey(() => Order)
    @Column({
        allowNull: true,
        unique: true,
        type: DataType.INTEGER,
    })
    declare orderId: number | null;

    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare openedByUserId: number | null;

    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare closedByUserId: number | null;

    @Column({
        allowNull: false,
        defaultValue: TABLE_SESSION_STATUS.OPEN,
        type: DataType.ENUM(...Object.values(TABLE_SESSION_STATUS)),
    })
    declare status: TABLE_SESSION_STATUS;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare sessionToken: string;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare closedAt: Date | null;

    @BelongsTo(() => DiningTable)
    table!: DiningTable;

    @BelongsTo(() => Carts)
    cart!: Carts;

    @BelongsTo(() => Order)
    order!: Order | null;

    @BelongsTo(() => User, 'openedByUserId')
    openedBy!: User | null;

    @BelongsTo(() => User, 'closedByUserId')
    closedBy!: User | null;

    @HasMany(() => KitchenTicket)
    kitchenTickets!: KitchenTicket[];
}
