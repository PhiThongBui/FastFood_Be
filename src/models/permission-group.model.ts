import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface PermissionGroupCreationAttributes {
  key: string;
  label: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

@Table({
  tableName: 'PermissionGroups',
})
export class PermissionGroup extends Model<
  PermissionGroup,
  PermissionGroupCreationAttributes
> {
  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING,
  })
  declare key: string;

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
