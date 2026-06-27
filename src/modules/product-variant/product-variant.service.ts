import { ComboItem, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
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
    @InjectModel(ComboItem) private readonly modelComboItem: typeof ComboItem,
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

  async findProductIsCombo(_id: number, comboItemId?: number) {
    const targetVariant = await this.modelProductVariant.findByPk(_id, {
      include: [
        {
          model: this.modelProduct,
          attributes: ['id', 'basePrice'],
          required: true
        }
      ]
    });
    if (!targetVariant) {
      throw new BadRequestException(`ProductVariant with id ${_id} not found!!!`);
    }

    let baseComboVariant = targetVariant;

    if (comboItemId) {
      const comboItem = await this.modelComboItem.findByPk(comboItemId, {
        include: [
          {
            model: this.modelProductVariant,
            required: true,
            include: [
              {
                model: this.modelProduct,
                attributes: ['id', 'basePrice'],
                required: true
              }
            ]
          }
        ]
      });

      if (!comboItem?.dataValues.productVariant) {
        throw new BadRequestException(`ComboItem with id ${comboItemId} not found!!!`);
      }

      baseComboVariant = comboItem.dataValues.productVariant;
    }

    const comboEligibleVariants = await this.modelProductVariant.findAll({
      where: {
        isComboItem: true,
        isActive: true
      },
      attributes: ['productId']
    });

    const eligibleProductIds = Array.from(
      new Set(comboEligibleVariants.map(variant => Number(variant.productId)).filter(Boolean))
    );

    if (eligibleProductIds.length === 0) {
      return [];
    }

    const candidateVariants = await this.modelProductVariant.findAll({
      where: {
        productId: eligibleProductIds,
        isActive: true,
        size: baseComboVariant.size,
        type: baseComboVariant.type
      },
      attributes: [
        'id',
        'modifiedPrice',
        'productId',
        'size',
        'type',
        'isComboItem'
      ],
      include: [
        {
          model: this.modelProduct,
          attributes: ['id', 'name', 'imageUrl', 'basePrice'],
          where: {
            isActive: true
          }
        },
      ]
    });

    const bestVariantByProduct = new Map<number, any>();
    const baseComboVariantId = Number(baseComboVariant.id);
    const baseComboVariantModifiedPrice = Number(baseComboVariant.dataValues.modifiedPrice || 0);

    for (const variant of candidateVariants) {
      const product = variant.dataValues.product;
      const productId = Number(product?.id);
      if (!productId) continue;

      const priceDifference = Number(variant.id) === baseComboVariantId
        ? 0
        : Number(variant.dataValues.modifiedPrice || 0) - baseComboVariantModifiedPrice;
      const priceStatus =
        priceDifference > 0 ? 'increase' :
          priceDifference < 0 ? 'decrease' :
            'equal';

      const candidate = {
        id: variant.id,
        modifiedPrice: Number(variant.dataValues.modifiedPrice || 0),
        priceDifference,
        priceStatus,
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl
        }
      };

      const currentBest = bestVariantByProduct.get(productId);
      if (!currentBest) {
        bestVariantByProduct.set(productId, candidate);
        continue;
      }

      const currentGap = Math.abs(Number(currentBest.priceDifference));
      const nextGap = Math.abs(Number(candidate.priceDifference));

      if (nextGap < currentGap) {
        bestVariantByProduct.set(productId, candidate);
        continue;
      }

      if (nextGap === currentGap && Number(candidate.id) < Number(currentBest.id)) {
        bestVariantByProduct.set(productId, candidate);
      }
    }

    return Array.from(bestVariantByProduct.values());
  }



}
