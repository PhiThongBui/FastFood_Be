import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Product } from './product.model';
import { CartItems } from './cart-items.model';

export enum PRODUCTVARIANTSIZE {
    SMALL = '15cm',
    MEDIUM = '20cm',
    LARGE = '25cm',
}
export enum PRODUCTVARIANTTYPE {
    THIN = 'Mỏng',
    NORMAL = 'Bình thường',
}

@Table
export class ProductVariant extends Model<ProductVariant> {
    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    name: string;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(PRODUCTVARIANTSIZE)),
    })
    size: PRODUCTVARIANTSIZE;


    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(PRODUCTVARIANTTYPE)),
    })
    type: PRODUCTVARIANTTYPE;


    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    modifiedPrice: number;

    @Column({
        allowNull:  true,
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    isActive: boolean;

    //relations
    @ForeignKey(() => Product)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    productId: number;

    @BelongsTo(() => Product)
    product: Product

    @HasMany(() => CartItems)
    cartItems: CartItems[];

}