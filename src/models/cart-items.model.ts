import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Carts } from './carts.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { CartItemsIngredient } from './cart-items-ingredient.model';

@Table
export class CartItems extends Model<CartItems> {

    @ForeignKey(() => Carts)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    cartId: number;

    @BelongsTo(() => Carts)
    cart: Carts

    @ForeignKey(() => Product)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    productId: number;

    @BelongsTo(() => Product)
    product: Product


    @ForeignKey(() => ProductVariant)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    ProductVariantId: number;
    @BelongsTo(() => ProductVariant)
    productVariant: ProductVariant;


    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    quantity: number


    //relation

    @HasMany(() => CartItemsIngredient)
    cartItemIngredients: CartItemsIngredient[]

}