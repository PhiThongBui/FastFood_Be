import { CartItemsIngredient } from '@/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

@Injectable()
export class CartItemIngredientService {
    constructor(
        @InjectModel(CartItemsIngredient) private readonly modelCartItemIngredient: typeof CartItemsIngredient
    ) { }

    async existedCartItemIngredient(idCartItem: number, idIngredient: number[]) {
        if (!idCartItem) throw new Error('CartItem Ingredient không được tìm thấy!!!');
        if (!idIngredient || idIngredient.length === 0) {
            return false; // hoặc throw error tùy logic
        }

        const cartItemIngredientInstance = await this.getCartItemIngredient(idCartItem);
        const cartItemIngredient = cartItemIngredientInstance.map(
            item => item?.dataValues?.ingredientId
        );

        // So sánh độ dài
        if (cartItemIngredient.length !== idIngredient.length) {
            return false;
        }

        // Sort cả 2 mảng để tránh ảnh hưởng bởi thứ tự
        const sortedCart = [...cartItemIngredient].sort((a, b) => a - b);
        const sortedId = [...idIngredient].sort((a, b) => a - b);

        // So sánh từng phần tử
        const isEqual = sortedCart.every((val, index) => val === sortedId[index]);
        console.log("isEqual", isEqual);

        // Nếu giống nhau thì trả về instance, ngược lại false
        return isEqual ? cartItemIngredientInstance : false;
    }

    async returnDataHasIngredient(idCartItem: number[]) {
        const cartItem = await this.modelCartItemIngredient.findAll({
            where: {
                cartItemId: {
                    [Op.in]: idCartItem
                }
            }
        })
        return cartItem
    }

    
    // async getCartItemIngredientByCartItem(idCartItem: number) {

    // }

    async getCartItemIngredient(idCartItem: number) {
        return await this.modelCartItemIngredient.findAll({
            where: {
                cartItemId: idCartItem
            }
        })
    }

    async getAllCartItemIngredient() {
        return await this.modelCartItemIngredient.findAll()
    }

    async hasIngredient(cartItem: number): Promise<boolean> {
        const count = await this.modelCartItemIngredient.count({
            where: {
                cartItemId: cartItem
            }
        })
        return count > 0
    }
}
