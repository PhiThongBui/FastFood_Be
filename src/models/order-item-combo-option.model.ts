import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { OrderItems } from './order-items.model';
import { ComboItem } from './combo-item.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { OrderItemComboOptionIngredient } from './order-item-combo-option-ingredient.model';

@Table
export class OrderItemComboOption extends Model<OrderItemComboOption> {
    @ForeignKey(() => OrderItems)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare orderItemId: number;

    @BelongsTo(() => OrderItems)
    orderItem!: OrderItems;

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

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare productNameSnapshot: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare variantNameSnapshot: string;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare unitPriceSnapshot: number;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare originalProductNameSnapshot?: string | null;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare originalVariantNameSnapshot?: string | null;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare selectedProductNameSnapshot?: string | null;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare selectedVariantNameSnapshot?: string | null;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare originalVariantModifiedPriceSnapshot: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare selectedVariantModifiedPriceSnapshot: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare variantSurchargeSnapshot: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare ingredientSurchargeSnapshot: number;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare surchargeSnapshot: number;

    @HasMany(() => OrderItemComboOptionIngredient, {
        onDelete: 'CASCADE',
        hooks: false,
    })
    ingredients!: OrderItemComboOptionIngredient[];
}
