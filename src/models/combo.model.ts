import { BeforeUpdate, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Category } from './category.model';
import { ComboItem } from './combo-item.model'; // Bảng trung gian
import { Helper } from '@/utils/helper';

@Table
export class Combo extends Model<Combo> {
  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING,
  })
  declare name: string;

  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING,
  })
  declare slug: string;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  declare description: string;

  // Đây là giá cố định của combo (ví dụ: 199.000)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare price: number;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  declare imageUrl: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    type: DataType.BOOLEAN,
  })
  declare isActive: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  declare isFeatured: boolean;
  // 🔥 THÊM CỘT NÀY
  @Column({
    allowNull: false,
    defaultValue: 0, // Mặc định giảm 0%
    type: DataType.INTEGER,
    comment: 'Phần trăm giảm giá của Combo (VD: 10 nghĩa là 10%)'
  })
  declare discountPercentage: number;
  @ForeignKey(() => Category)
  @Column({
    allowNull: false, // Có thể cho phép null nếu combo không thuộc category nào
    type: DataType.INTEGER,
  })
  declare categoryId: number;

  @BelongsTo(() => Category)
  category: Category;


  // Một combo sẽ có nhiều món hàng
  @HasMany(() => ComboItem, {
    onDelete: 'CASCADE',
    hooks: false,
  })
  items: ComboItem[];

  @BeforeUpdate
  static updateCombo(combo: Combo) {
    if (combo.changed('name')) {
      const slug = Helper.converttoSlug(combo.dataValues.name);
      combo.setDataValue('slug', slug);
    }
  }
}