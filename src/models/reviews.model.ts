import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { Product } from './product.model';
import { Order } from './order.model';

@Table
export class Reviews extends Model<Reviews> {
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare rating: Number;


    @Column({
        allowNull: false,
        type: DataType.TEXT,
    })
   declare comment: string;

    @ForeignKey(() => Product)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare productId: number

    @ForeignKey(() => User)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare userId: number

    @ForeignKey(() => Order)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare orderId: number


    @BelongsTo(() => User)
    user: User

    @BelongsTo(() => Product)
    product: Product

    @BelongsTo(() => Order, { constraints: false })
    order: Order
}
