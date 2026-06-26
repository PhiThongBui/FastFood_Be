import { ingredients } from './../seeder/data/data';
import { Ingredient } from '@/models';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { GetIngredientPricesDto } from './dto/get-ingredient-prices.dto';

@Injectable()
export class IngredientService {
    constructor(
        @InjectModel(Ingredient) private readonly modelIngredient: typeof Ingredient
    ) { }


    async findOneIngredient(id: number) {
        const result = await this.modelIngredient.findOne({ where: { id } });
        if (result === null) throw new BadRequestException('Ingredient chưa được tìm thấy');
        return {
            data: result
        }
    }

    async existedIngredient(ingredientsId: number[]) {
        const result = await this.modelIngredient.findAll({
            where: {
                id: {
                    [Op.in]: ingredientsId
                }
            },
            attributes: ['id'], // Chỉ lấy ID thay vì tất cả columns
            raw: true
        });
        const idsResult = result.map((ingredient) => ingredient.id); 
        const idNotExsited = ingredientsId.filter((id) => !idsResult.includes(id));
        if (idNotExsited.length > 0) {
            throw new BadRequestException(`Ingredient with id ${idNotExsited} not found!!!`);
        }
    }

    async getIngredientPrices(dto: GetIngredientPricesDto) {
        const ingredientIds = dto.ingredientIds.map(id => Number(id));
        const uniqueIds = Array.from(new Set(ingredientIds));

        const ingredients = await this.modelIngredient.findAll({
            where: {
                id: {
                    [Op.in]: uniqueIds
                }
            },
            attributes: ['id', 'price', 'name'],
            raw: true
        });

        const ingredientMap = new Map(
            ingredients.map(ingredient => [Number(ingredient.id), Number(ingredient.price)])
        );

        const missingIds = uniqueIds.filter(id => !ingredientMap.has(id));
        if (missingIds.length > 0) {
            throw new BadRequestException(`Ingredient with id ${missingIds} not found!!!`);
        }

        const pricingItems = ingredientIds.map(id => ({
            id,
            price: ingredientMap.get(id) || 0,
            name: ingredients.find(ingredient => Number(ingredient.id) === id)?.name || ''
        }));

        const totalPrice = pricingItems.reduce((sum, item) => sum + item.price, 0);

        return {
            ingredients: pricingItems,
            totalPrice
        };
    }
}
