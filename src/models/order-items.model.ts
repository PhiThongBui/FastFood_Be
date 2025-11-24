import { BelongsTo, Column, DataType, ForeignKey, Model, Table, HasMany } from 'sequelize-typescript';
import { Category } from './category.model';
import { Order } from './order.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { OrderItemIngredient } from './order-items-ingredient.model';
import { Combo } from './combo.model';

@Table
export class OrderItems extends Model<OrderItems> {
    @ForeignKey(() => Order)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    orderId: number;

    @ForeignKey(() => Product)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    productId: number;

    @ForeignKey(() => ProductVariant)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    productVariantId?: number | null;

    @ForeignKey(() => Combo)
    @Column({
        allowNull: true, // Null nghĩa là mua món lẻ, có giá trị là mua combo
        type: DataType.INTEGER,
    })
    comboId: number | null;

    @BelongsTo(() => Combo)
    combo: Combo;


    @BelongsTo(() => Order)
    order: Order;

    @BelongsTo(() => Product)
    product: Product;

    @BelongsTo(() => ProductVariant)
    productVariant: ProductVariant;

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    quantity: number


    //relations

    @HasMany(() => OrderItemIngredient,{
        onDelete: 'CASCADE',
        hooks: false
    })
    orderItemIngredients: OrderItemIngredient[];
}