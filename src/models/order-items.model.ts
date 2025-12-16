import { BelongsTo, Column, DataType, ForeignKey, Model, Table, HasMany } from 'sequelize-typescript';
import { Category } from './category.model';
import { Order } from './order.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { OrderItemIngredient } from './order-items-ingredient.model';
import { Combo } from './combo.model';
export interface OrderItemMetadata {
    itemName: string;        // Tên hiển thị (VD: Combo Sinh Viên)
    originalPrice: number;   // Giá gốc
    finalPrice: number;      // Giá sau khi cộng thêm (Upsize, Topping)
    
    // Chi tiết các món bên trong (Dành cho Combo)
    items?: {
        productId: number;
        productName: string; // Lưu tên lúc mua
        variantId: number;
        unitPrice: number;   // Giá của item này (nếu cần tách lẻ)
        ingredients: {       // Topping của item này
            name: string;
            quantity: number;
            price: number;   // Giá topping lúc mua
        }[];
    }[];
}
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
        allowNull: true,
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
// 🔥 SỬA 3: Cột quan trọng nhất để lưu lịch sử đơn hàng
    @Column({
        type: DataType.JSON, // Postgres dùng JSONB sẽ tốt hơn, MySQL dùng JSON
        allowNull: true,
    })
    metadata: OrderItemMetadata;

    //relations

    @HasMany(() => OrderItemIngredient,{
        onDelete: 'CASCADE',
        hooks: false
    })
    orderItemIngredients: OrderItemIngredient[];
}