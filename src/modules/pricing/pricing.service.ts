import { CartItems, Product, ProductIngredient, ProductVariant } from '@/models';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class PricingService {
    private readonly logger = new Logger(PricingService.name)

    constructor(
        @InjectModel(CartItems) private readonly modelCartItem: typeof CartItems,
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient
    ) { }

    async getPricing(){

    }
}
