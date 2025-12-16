import { BelongsTo, Column, DataType, ForeignKey, Model, Table, HasMany } from 'sequelize-typescript';
import { Category } from './category.model';
import { Order } from './order.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { OrderItemIngredient } from './order-items-ingredient.model';
import { Combo } from './combo.model';
export interface OrderItemMetadata {
    itemName: string;        
    originalPrice: number;   
    finalPrice: number;      
    
    // Dành cho Combo
    items?: {
        productId: number;
        productName: string;
        variantId: number;
        variantName: string; // Nên thêm trường này để hiển thị Size/De ma khong can join
        unitPrice: number;   
        ingredients: {       
            name: string;
            quantity: number;
            price: number;
            type: 'ADD' | 'REMOVE'; // 🔥 CẦN THÊM: Để hiển thị "Không lấy..." trong lịch sử đơn
        }[];
    }[];

    // Dành cho Món Lẻ (Nên lưu snapshot cả món lẻ vào đây luôn)
    singleItemMetadata?: {
        variantName: string;
        ingredients: {
            name: string;
            quantity: number;
            price: number;
            type: 'ADD' | 'REMOVE';
        }[];
    }
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