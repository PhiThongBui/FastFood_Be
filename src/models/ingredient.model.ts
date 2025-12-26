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
    declare name: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare imageUrl: string;


    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare description: string;

    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare price: number;

    @Column({
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;


    @Column({
        defaultValue: false,
        type: DataType.BOOLEAN,
    })
    declare isRequired: boolean;


    // relation
    @ForeignKey(() => Category)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare categoryId: number

    @BelongsTo(() => Category)
    category: Category

    @HasMany(() => ProductIngredient, {
        onDelete: 'CASCADE',
        hooks: false
    })
    productIngredients: ProductIngredient

    @HasMany(() => OrderItemIngredient, {
        onDelete: 'CASCADE',
        hooks: false
    })
    orderItemIngredients: OrderItemIngredient

    @HasMany(() => CartItemsIngredient, {
        onDelete: 'CASCADE',
        hooks: false
    })
    cartItemIngredients: CartItemsIngredient
}