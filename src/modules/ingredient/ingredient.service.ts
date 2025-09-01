import { ingredients } from './../seeder/data/data';
import { Ingredient } from '@/models';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

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
}
