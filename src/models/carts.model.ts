import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';

@Table
export class Carts extends Model<Carts> {
    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    userId: number;

    @BelongsTo(() => User)
    user: User

}