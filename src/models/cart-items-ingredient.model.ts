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
   declare cartItemId: number

    @ForeignKey(() => Ingredient)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare ingredientId: number

    @BelongsTo(() => CartItems)
    cartItem!: CartItems
    @BelongsTo(() => Ingredient)
    ingredient!: Ingredient

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
   declare quantity: number

    // 🔥 THÊM CỘT NÀY: Để phân biệt Thêm hay Bỏ
    @Column({
        type: DataType.ENUM('ADD', 'REMOVE'),
        defaultValue: 'ADD',
        allowNull: false
    })
   declare type: 'ADD' | 'REMOVE'; // ✅ Thay đổi ở đây

}