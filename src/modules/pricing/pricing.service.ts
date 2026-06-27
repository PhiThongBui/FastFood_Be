import { ComboItem, Product, ProductVariant } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { GetPricingFeatureDto, GetPricingNoQuantityDto } from './dto/getPricingNoQuantity.dto';

@Injectable()
export class PricingService {
    constructor(
        @InjectModel(ComboItem) private readonly modelComboItem: typeof ComboItem,
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        private readonly sequelize: Sequelize
    ) { }

    async getSinglePricing(dto: GetPricingNoQuantityDto) {
        const { comboItemId, productVariantId } = dto;

        if (!productVariantId || !comboItemId) {
            throw new BadRequestException(
                'Cần truyền productVariantId và comboItemId khi tính giá đổi món trong combo'
            );
        }

        const productVariant = await this.modelProductVariant.findByPk(productVariantId, {
            include: [
                {
                    model: this.modelProduct,
                    attributes: {
                        include: [
                            [
                                this.sequelize.literal(
                                    `"product"."basePrice" + "ProductVariant"."modifiedPrice"`
                                ),
                                'variantPrice',
                            ],
                        ],
                    },
                },
            ],
        });

        if (!productVariant) {
            throw new BadRequestException('Không có dữ liệu giá cho biến thể này');
        }

        const comboItem = await this.modelComboItem.findByPk(comboItemId, {
            include: [
                {
                    model: this.modelProductVariant,
                    attributes: ['id', 'modifiedPrice'],
                    required: true
                }
            ]
        });

        if (!comboItem?.dataValues.productVariant) {
            throw new BadRequestException(`ComboItem with id ${comboItemId} not found!!!`);
        }

        const raw = productVariant.get({ plain: true }) as unknown as {
            product: Product & { variantPrice: number };
        };

        const comboItemVariant = comboItem.dataValues.productVariant;
        const variantSurcharge = Number(productVariant.dataValues.id) === Number(comboItemVariant.id)
            ? 0
            : Number(productVariant.dataValues.modifiedPrice || 0) - Number(comboItemVariant.dataValues.modifiedPrice || 0);

        return {
            variantPrice: raw.product.variantPrice,
            variantSurcharge
        };
    }

    async getSinglePricingFeature(dto: GetPricingFeatureDto) {
        const { productVariantId, productId } = dto;

        if (productVariantId && productId) {
            throw new BadRequestException(
                'Chỉ truyền 1 trong 2: productVariantId hoặc productId'
            );
        }

        if (productVariantId) {
            const isVariantInCombo = await this.modelComboItem.count({
                where: { productVariantId }
            });

            const productVariant = await this.modelProductVariant.findByPk(productVariantId, {
                include: [
                    {
                        model: this.modelProduct,
                        attributes: {
                            include: [
                                [
                                    this.sequelize.literal(
                                        `"product"."basePrice" + "ProductVariant"."modifiedPrice"`
                                    ),
                                    'variantPrice',
                                ],
                            ],
                        },
                    },
                ],
            });

            if (!productVariant) {
                throw new BadRequestException('Không có dữ liệu giá cho biến thể này');
            }

            const raw = productVariant.get({ plain: true }) as unknown as {
                product: Product & { variantPrice: number };
            };

            return {
                variantPrice: raw.product.variantPrice,
                variantSurcharge: isVariantInCombo > 0
                    ? 0
                    : productVariant.dataValues.modifiedPrice
            };
        }

        if (productId) {
            const product = await this.modelProduct.findByPk(productId);
            if (!product) {
                throw new BadRequestException('Không có dữ liệu giá cho sản phẩm này');
            }

            return { variantPrice: product.dataValues.basePrice };
        }

        throw new BadRequestException(
            'Cần truyền productVariantId hoặc productId'
        );
    }
}
