import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Combo } from './combo.model';
import { ProductVariant } from './product-variant.model';
import { Product } from './product.model';

@Table
export class ComboItem extends Model<ComboItem> {
  // Liên kết tới combo cha
  @ForeignKey(() => Combo)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  comboId: number;

  @BelongsTo(() => Combo)
  combo: Combo;

  // Liên kết tới sản phẩm
  @ForeignKey(() => Product)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  productId: number;

  @BelongsTo(()=>Product)
  product: Product
  // Liên kết tới biến thể sản phẩm cụ thể
  // Rất quan trọng: Phải liên kết tới ProductVariant
  // vì combo bao gồm "Pizza 20cm" chứ không phải "Pizza" chung chung
  @ForeignKey(() => ProductVariant)
  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  productVariantId: number;

  @BelongsTo(() => ProductVariant)
  productVariant: ProductVariant;

  // Số lượng của sản phẩm đó trong combo
  // Ví dụ: 2 Coca-Cola
  @Column({
    allowNull: false,
    defaultValue: 1,
    type: DataType.INTEGER,
  })
  quantity: number;
}