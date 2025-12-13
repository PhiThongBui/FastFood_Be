import { Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectModel(Product) private readonly modelProduct: typeof Product,
    @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
    @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
    @InjectModel(Ingredient) private readonly ingredientModel: typeof Ingredient,
    private readonly sequelize: Sequelize
  ) { }

  async findOneProductVariant(idProductVariant: number, idProduct: number) {
    const result = await this.modelProductVariant.findOne({ where: { id: idProductVariant, productId: idProduct } });
    if (result === null) throw new BadRequestException('Product Variant chưa được tìm thấy');
    return {
      data: result
    }
  }

  async existedProductVanriantDB(productId: number, size: string, type: string) {
    return await this.modelProductVariant.findOne({
      where: {
        productId: productId,
        size: size,
        type: type
      }
    })
  }

  async findById(id: number) {
    return await this.modelProductVariant.findByPk(id);
  }

  async findProductIsCombo(_id: number) {
    const targetVariant = await this.modelProductVariant.findByPk(_id);
    if (!targetVariant) {
      throw new BadRequestException(`ProductVariant with id ${_id} not found!!!`);
    }
    return await this.modelProductVariant.findAll({
      where: {
        isComboItem: true
      },
      attributes: [
        'id',
        'modifiedPrice',
        [
          this.sequelize.literal(`"modifiedPrice" - ${targetVariant.dataValues.modifiedPrice}`),
          'priceDifference'
        ],
        [
          this.sequelize.literal(`
            CASE 
              WHEN "modifiedPrice" > ${targetVariant.dataValues.modifiedPrice} THEN 'increase'
              WHEN "modifiedPrice" < ${targetVariant.dataValues.modifiedPrice} THEN 'decrease'
              ELSE 'equal'
            END
          `),
          'priceStatus'
        ]
      ],
      include: [
        {
          model: this.modelProduct,
          attributes: ['id', 'name', 'imageUrl'],
        },
      ]
    });
  }



}
