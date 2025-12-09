import { CartItems, Product, ProductIngredient, ProductVariant } from '@/models';
import { Injectable, Logger } from '@nestjs/common';
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
        const { productVariantId } = dto;

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
                                'variantPrice'
                            ]
                        ]
                    }
                }
            ]
        });

        if (!productVariant) return 'Không có dữ liệu';

        const rawData = productVariant.get({ plain: true }) as unknown as {
            product: Product & { variantPrice: number }
        };

        return {
            variantPrice: rawData.product.variantPrice
        }
    }

}
