import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'store_policy_settings',
})
export class StorePolicySetting extends Model<StorePolicySetting> {
    @Column({
        primaryKey: true,
        allowNull: false,
        defaultValue: 1,
        type: DataType.INTEGER,
    })
    declare id: number;

    @Column({
        allowNull: false,
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    declare allowUserCancel: boolean;

    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare cancelBeforeMinutes: number | null;

    @Column({
        allowNull: false,
        defaultValue: false,
        type: DataType.BOOLEAN,
    })
    declare allowCancelPaidOrder: boolean;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare storeName: string | null;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare storeAddress: string | null;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare storePhone: string | null;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare storeEmail: string | null;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare openingHours: string | null;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare deliveryPolicy: string | null;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare cancellationPolicy: string | null;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare paymentPolicy: string | null;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    declare contactPolicy: string | null;
}
