import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { TableSession } from './table-session.model';

export enum DINING_TABLE_STATUS {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    DISABLED = 'DISABLED',
}

@Table
export class DiningTable extends Model<DiningTable> {
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING,
    })
    declare code: string;

    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    declare name: string;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare area: string | null;

    @Column({
        allowNull: false,
        defaultValue: DINING_TABLE_STATUS.AVAILABLE,
        type: DataType.ENUM(...Object.values(DINING_TABLE_STATUS)),
    })
    declare status: DINING_TABLE_STATUS;

    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING,
    })
    declare qrToken: string;

    @HasMany(() => TableSession)
    sessions!: TableSession[];
}
