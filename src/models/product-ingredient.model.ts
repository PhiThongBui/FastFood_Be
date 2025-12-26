import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Product } from './product.model';
import { Ingredient } from './ingredient.model';

@Table
export class ProductIngredient extends Model<ProductIngredient> {
    @ForeignKey(() => Product)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare productId: number

    @BelongsTo(() => Product)
    product: Product

    @ForeignKey(() => Ingredient)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
   declare ingredientId: number

    @BelongsTo(() => Ingredient)
    ingredient: Ingredient


    @Column({
        defaultValue: false,
        type: DataType.BOOLEAN,
    })
   declare isDefault: boolean

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
   declare quantity: number


    //relation

    
}