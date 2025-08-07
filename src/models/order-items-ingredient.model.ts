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
    orderItemId: number;

    @BelongsTo(() => OrderItems)
    orderItem: OrderItems

    @ForeignKey(() => Ingredient)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    ingredientId: number;

    @BelongsTo(() => Ingredient)
    ingredient: Ingredient

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    quantity: number

}