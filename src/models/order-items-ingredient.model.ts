import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { OrderItems } from './order-items.model';
import { Ingredient } from './ingredient.model';

@Table
export class OrderItemIngredient extends Model<OrderItemIngredient> {
    @ForeignKey(() => OrderItems)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare orderItemId: number;

    @BelongsTo(() => OrderItems)
    orderItem: OrderItems

    @ForeignKey(() => Ingredient)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare ingredientId: number;

    @BelongsTo(() => Ingredient)
    ingredient: Ingredient

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
   declare quantity: number

    // 🔥 CẦN THÊM: Để lưu trạng thái Thêm/Bớt từ Cart chuyển sang
    @Column({
        type: DataType.ENUM('ADD', 'REMOVE'),
        defaultValue: 'ADD', 
        allowNull: false
    })
   declare type: string;

}