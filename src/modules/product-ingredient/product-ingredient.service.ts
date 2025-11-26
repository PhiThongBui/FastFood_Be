import { Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

@Injectable()
export class ProductIngredientService {
    constructor(
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
        @InjectModel(Ingredient) private readonly ingredientModel: typeof Ingredient,

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

    async getIngredientDefaultById(productId: number) {
        return await this.modelProductIngredient.findAll(
            {
                where: {
                    isDefault: true,
                    productId
                },
                attributes: ['id','isDefault'],
                include: [
                    {
                        model: this.ingredientModel,
                        attributes: ['name', 'imageUrl', 'price' , 'isRequired']
                    }
                ]
            }
        );
    }
}
