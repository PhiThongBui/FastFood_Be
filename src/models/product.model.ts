import { BeforeUpdate, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Category } from './category.model';
import { ProductVariant } from './product-variant.model';
import { ProductIngredient } from './product-ingredient.model';
import { OrderItems } from './order-items.model';
import { CartItems } from './cart-items.model';
import { Reviews } from './reviews.model';
import { Helper } from '@/utils/helper';

@Table
export class Product extends Model<Product> {
  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING,
  })
  name: string;

  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING,
  })
  slug: string;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  description: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  basePrice: number;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  imageUrl: string;

  @Column({
    allowNull: true,
    defaultValue: true,
    type: DataType.BOOLEAN,
  })
  isActive: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  isFeatured: boolean; // sản phẩm hot theo tuần VD: Hiển thị trang đầu để quảng bá

  @ForeignKey(() => Category)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  categoryId: number;

  @BelongsTo(() => Category)
  category: Category

  @HasMany(() => ProductVariant, {
    onDelete: 'CASCADE',
    hooks: false
  })
  variants: ProductVariant[]

  @HasMany(() => ProductIngredient, {
    onDelete: 'CASCADE',
    hooks: false
  })
  ingredients: ProductIngredient[]


  @HasMany(() => OrderItems, {
    onDelete: 'CASCADE',
    hooks: false
  })
  orderItems: OrderItems


  @HasMany(() => CartItems, {
    onDelete: 'CASCADE',
    hooks: false
  })
  cartItems: CartItems


  @HasMany(() => Reviews, {
    onDelete: 'CASCADE',
    hooks: false
  })
  reviews: Reviews
  @BeforeUpdate
  static updateProduct(product: Product) {
    if (product.changed('name')) {
      const slug = Helper.converttoSlug(product.dataValues.name)
      product.setDataValue('slug', slug)
    }
  }
} 