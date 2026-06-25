import { Carts, User } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class CartService {

    constructor(
        @InjectModel(Carts) private readonly modelCarts: typeof Carts,
        @InjectModel(User) private readonly modelUser: typeof User,
        private readonly sequelize: Sequelize
    ) { }

    async getOrCreateUserCart(userId: number, transaction?: any) {
        const user = await this.modelUser.findByPk(userId, { transaction });
        if (!user) {
            throw new BadRequestException(`User ${userId} not found`);
        }

        let cart = await this.modelCarts.findOne({
            where: {
                userId: userId,
            },
            transaction: transaction
        })

        if (!cart) {
            cart = await this.modelCarts.create({ userId } as Carts, { transaction: transaction })
        }

        return cart
    }

    async getOrCreateGuestCart(sessionId: string, transaction?: any) {
        let cart = await this.modelCarts.findOne({
            where: {
                sessionId: sessionId,
            },
            transaction: transaction
        })

        if (!cart) {
            cart = await this.modelCarts.create({ sessionId } as Carts, { transaction })
        }

        return cart
    }

    async getCartByContext(sessionId: string | undefined, userId: number | null | undefined, transaction?: any) {
        if (userId) {
            return await this.getOrCreateUserCart(userId, transaction)
        } else if (sessionId) {
            return await this.getOrCreateGuestCart(sessionId, transaction)
        } else {
            throw new BadRequestException('User id or session id not found')
        }
    }
}
