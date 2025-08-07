import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CartItems } from './cart-items.model';
import { Ingredient } from './ingredient.model';

@Table
export class CartItemsIngredient extends Model<CartItemsIngredient> {
    @ForeignKey(() => CartItems)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    cartItemId: number
    @ForeignKey(() => Ingredient)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    ingredientId: number

    @BelongsTo(() => CartItems)
    cartItem: CartItems
    @BelongsTo(() => Ingredient)
    ingredient: Ingredient

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    quantity: number
}