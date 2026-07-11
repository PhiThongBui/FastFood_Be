import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Product } from './product.model';
import { CartItems } from './cart-items.model';

export enum PRODUCTVARIANTSIZE {
    DEFAULT = 'DEFAULT',
    SMALL = '15cm',
    MEDIUM = '20cm',
    LARGE = '25cm',
}
export enum PRODUCTVARIANTTYPE {
    DEFAULT = 'DEFAULT',
    THIN = 'Mỏng',
    NORMAL = 'Bình thường',
}

@Table
export class ProductVariant extends Model<ProductVariant> {
    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare name: string; // ✅ Thêm declare

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(PRODUCTVARIANTSIZE)),
    })
    declare size: PRODUCTVARIANTSIZE; // ✅ Thêm declare

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(PRODUCTVARIANTTYPE)),
    })
    declare type: PRODUCTVARIANTTYPE; // ✅ Thêm declare

    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare modifiedPrice: number; // ✅ Thêm declare

    @Column({
        allowNull: false,
        defaultValue: false,
        type: DataType.BOOLEAN,
    })
    declare isComboItem: boolean; // ✅ Thêm declare

    @Column({
        allowNull: true,
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean; // ✅ Thêm declare

    //relations
    @ForeignKey(() => Product)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare productId: number; // 🔥 QUAN TRỌNG NHẤT: Thêm declare để fix lỗi undefined

    @BelongsTo(() => Product)
    product: Product;

    @HasMany(() => CartItems, {
        onDelete: 'CASCADE',
        hooks: false
    })
    cartItems: CartItems[];
}
