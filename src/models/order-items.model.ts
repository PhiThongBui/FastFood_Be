import { BelongsTo, Column, DataType, ForeignKey, Model, Table, HasMany } from 'sequelize-typescript';
import { Category } from './category.model';
import { Order } from './order.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { OrderItemIngredient } from './order-items-ingredient.model';

@Table
export class OrderItems extends Model<OrderItems> {
    @ForeignKey(() => Order)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    OrderId: number;

    @ForeignKey(() => Product)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    ProductId: number;

    @ForeignKey(() => ProductVariant)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    ProductVariantId: number;

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

    @HasMany(() => OrderItemIngredient)
    orderItemIngredients: OrderItemIngredient[];
}