import { CartItems, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GetPricingNoQuantityDto } from './dto/getPricingNoQuantity.dto';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class PricingService {
    private readonly logger = new Logger(PricingService.name)

    constructor(
        @InjectModel(CartItems) private readonly modelCartItem: typeof CartItems,
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
        private readonly sequelize: Sequelize
    ) { }

    async getSinglePricing(dto: GetPricingNoQuantityDto) {
        const { productVariantId, productId } = dto;

        if (productVariantId && productId) {
            throw new BadRequestException(
                'Chỉ truyền 1 trong 2: productVariantId hoặc productId'
            );
        }

        if (productVariantId) {
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
                variantSurcharge: productVariant.dataValues.modifiedPrice
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
