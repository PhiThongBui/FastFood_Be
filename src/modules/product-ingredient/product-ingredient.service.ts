import { ProductIngredient } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

@Injectable()
export class ProductIngredientService {
    constructor(
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient
    ) { }

    async existedProductIngredient(productIngredientsId: number[]) {
        const result = await this.modelProductIngredient.findAll({
            where: {
                id: {
                    [Op.in]: productIngredientsId
                }
            },
            attributes: ['id'], // Chỉ lấy ID thay vì tất cả columns
            raw: true
        });
        const idsResult = result.map((ingredient) => ingredient.id);
        const idNotExsited = productIngredientsId.filter((id) => !idsResult.includes(id));
        if (idNotExsited.length > 0) {
            throw new BadRequestException(`ProductIngredient with id ${idNotExsited} not found!!!`);
        }
    }
}
