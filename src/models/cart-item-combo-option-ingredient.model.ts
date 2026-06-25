import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { CartItemComboOption } from './cart-item-combo-option.model';
import { Ingredient } from './ingredient.model';

@Table
export class CartItemComboOptionIngredient extends Model<CartItemComboOptionIngredient> {
    @ForeignKey(() => CartItemComboOption)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare cartItemComboOptionId: number;

    @BelongsTo(() => CartItemComboOption)
    cartItemComboOption!: CartItemComboOption;

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
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    declare quantity: number;

    @Column({
        allowNull: false,
        defaultValue: 'ADD',
        type: DataType.ENUM('ADD', 'REMOVE'),
    })
    declare type: 'ADD' | 'REMOVE';
}
