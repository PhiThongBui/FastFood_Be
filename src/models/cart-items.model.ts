import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Carts } from './carts.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { CartItemsIngredient } from './cart-items-ingredient.model';
import { Combo } from './combo.model';
// Interface định nghĩa cấu trúc JSON (để gợi ý code)
export interface CartComboOption {
    productId: number;
    productVariantId: number;
    ingredients?: {
        ingredientId: number;
        quantity: number; // Ví dụ: Thêm 2 phần phô mai
        type: 'ADD' | 'REMOVE'; // Thêm hay Bỏ
    }[];
}
@Table
export class CartItems extends Model<CartItems> {

    @ForeignKey(() => Carts)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare cartId: number

    @BelongsTo(() => Carts)
    cart: Carts

    @ForeignKey(() => Product)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare productId: number;

    @BelongsTo(() => Product)
    product: Product


    @ForeignKey(() => ProductVariant)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare productVariantId: number;
    @BelongsTo(() => ProductVariant)
    productVariant: ProductVariant;

    @ForeignKey(() => Combo)
    @Column({
        allowNull: true, // Null nghĩa là mua món lẻ, có giá trị là mua combo
        type: DataType.INTEGER,
    })
    declare comboId: number | null;

    @BelongsTo(() => Combo)
    combo: Combo;

    @Column({
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    declare quantity: number

    // 🔥 SỬA 3: Cột JSON mới để lưu cấu hình Combo
    // Lưu mảng các món khách chọn: [{productId: 1, variantId: 5, ingredients: [...]}, ...]
    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    declare selectedOptions: CartComboOption[];
    //relation

    @HasMany(() => CartItemsIngredient, {
        onDelete: 'CASCADE',
        hooks: false
    })
    cartItemIngredients: CartItemsIngredient[]

}