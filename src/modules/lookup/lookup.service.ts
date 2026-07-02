import { Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class LookupService {
    constructor(
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
        @InjectModel(Ingredient) private readonly modelIngredient: typeof Ingredient
    ) { }

    lookUpVariant(productId: number) {
        return this.modelProductVariant.findAll({
            where: {
                productId: productId,
                isActive: true
            },
            attributes: ['id', 'name', 'size', 'type']
        })
    }

    lookUpChangeVariantCombo(productId: number) {
        return this.modelProduct.findByPk(productId, ({
            attributes: ['id', 'name', 'imageUrl'],
            include: [
                {
                    model: this.modelProductVariant,
                    attributes: ['id', 'name', 'size', 'type'],
                    where: {
                        isActive: true
                    }
                },
                {
                    model: this.modelProductIngredient,
                    attributes: ['id', 'isDefault'],
                    include: [
                        {
                            model: this.modelIngredient,
                            attributes: ['name']
                        }
                    ],
                    required:false,
                    where: {
                        isDefault: true
                    }
                }
            ]
        })
        )
    }
}
