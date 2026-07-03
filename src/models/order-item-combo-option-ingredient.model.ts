import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { OrderItemComboOption } from './order-item-combo-option.model';
import { Ingredient } from './ingredient.model';

@Table
export class OrderItemComboOptionIngredient extends Model<OrderItemComboOptionIngredient> {
    @ForeignKey(() => OrderItemComboOption)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare orderItemComboOptionId: number;

    @BelongsTo(() => OrderItemComboOption)
    orderItemComboOption!: OrderItemComboOption;

    @ForeignKey(() => Ingredient)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare ingredientId: number;

    @BelongsTo(() => Ingredient)
    ingredient!: Ingredient;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare ingredientNameSnapshot: string;

    @Column({
        allowNull: false,
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    declare quantity: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare priceSnapshot: number;

    @Column({
        allowNull: false,
        defaultValue: 'ADD',
        type: DataType.ENUM('ADD', 'REMOVE'),
    })
    declare type: 'ADD' | 'REMOVE';
}
