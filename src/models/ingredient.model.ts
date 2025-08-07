import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Category } from './category.model';
import { ProductIngredient } from './product-ingredient.model';
import { OrderItemIngredient } from './order-items-ingredient.model';
import { CartItemsIngredient } from './cart-items-ingredient.model';

@Table
export class Ingredient extends Model<Ingredient> {
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING,
    })
    name: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    imageUrl: string;


    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    description: string;

    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    price: number;

    @Column({
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    isActive: boolean;


    @Column({
        defaultValue: false,
        type: DataType.BOOLEAN,
    })
    isRequired: boolean;


    // relation
    @ForeignKey(() => Category)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    categoryId: number

    @BelongsTo(() => Category)
    category: Category

    @HasMany(() => ProductIngredient)
    productIngredients: ProductIngredient

    @HasMany(() => OrderItemIngredient)
    orderItemIngredients: OrderItemIngredient

    @HasMany(() => CartItemsIngredient)
    cartItemIngredients: CartItemsIngredient
}