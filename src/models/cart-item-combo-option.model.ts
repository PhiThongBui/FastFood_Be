import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { CartItems } from './cart-items.model';
import { ComboItem } from './combo-item.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { CartItemComboOptionIngredient } from './cart-item-combo-option-ingredient.model';

@Table
export class CartItemComboOption extends Model<CartItemComboOption> {
    @ForeignKey(() => CartItems)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare cartItemId: number;

    @BelongsTo(() => CartItems)
    cartItem!: CartItems;

    @ForeignKey(() => ComboItem)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare comboItemId: number;

    @BelongsTo(() => ComboItem)
    comboItem!: ComboItem;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare slotIndex: number;

    @ForeignKey(() => Product)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare selectedProductId: number;

    @BelongsTo(() => Product)
    selectedProduct!: Product;

    @ForeignKey(() => ProductVariant)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare selectedProductVariantId: number;

    @BelongsTo(() => ProductVariant)
    selectedProductVariant!: ProductVariant;

    @HasMany(() => CartItemComboOptionIngredient, {
        onDelete: 'CASCADE',
        hooks: false,
    })
    ingredients!: CartItemComboOptionIngredient[];
}
