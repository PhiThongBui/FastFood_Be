import { BeforeValidate, BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { User } from './user.model';
import { BadRequestException } from '@nestjs/common';
import { CartItems } from './cart-items.model';

@Table
export class Carts extends Model<Carts> {
    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    userId: number;

    @Column({
        allowNull: true,
        type: DataType.STRING,
        unique: true
    })
    sessionId: string;

    @BelongsTo(() => User)
    user: User

    @HasMany(() => CartItems, {
        onDelete: 'CASCADE',
        hooks: false
    })
    cartItems: CartItems[];

    
    @BeforeValidate
    static validateCartOwnerShip(instance: Carts) {
        const hasSessionId = !!instance.dataValues.sessionId;
        const hasUserId = !!instance.dataValues.userId;
        if (!hasSessionId && !hasUserId) {
            throw new BadRequestException('Must have either sessionId or userId!');
        }
        if (hasSessionId && hasUserId) {
            throw new BadRequestException('Cannot have both sessionId and userId');
        }
    }
}