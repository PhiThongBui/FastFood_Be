import { Product, ProductIngredient, ProductVariant } from '@/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class LookupService {
    constructor(
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
    ) { }

    lookUpVariant(productId: number){
        return this.modelProductVariant.findAll({
            where: {
                productId: productId,
                isActive: true
            },
            attributes:['id', 'name', 'size', 'type']
        })
    }
}
