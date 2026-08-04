import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface PermissionCreationAttributes {
  value: string;
  groupKey: string;
  label: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

@Table({
  tableName: 'Permissions',
})
export class Permission extends Model<
  Permission,
  PermissionCreationAttributes
> {
  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING,
  })
  declare value: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  declare groupKey: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  declare label: string;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  declare description: string | null;

  @Column({
    allowNull: false,
    defaultValue: 0,
    type: DataType.INTEGER,
  })
  declare sortOrder: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    type: DataType.BOOLEAN,
  })
  declare isActive: boolean;
}
