import {
    CartItemComboOption,
    CartItemComboOptionIngredient,
    Combo,
    ComboItem,
    Ingredient,
    Product,
    ProductVariant
} from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
    GetPricingFeatureDto,
    GetPricingNoQuantityDto,
    PricingComboOptionDto,
    PricingIngredientOptionType,
    PricingIngredientOptionDto,
} from './dto/getPricingNoQuantity.dto';

type ComboPricingContext = {
    comboBasePrice: number;
    comboDiscountPercentage: number;
    discountedComboBasePrice: number;
};

@Injectable()
export class PricingService {
    constructor(
        @InjectModel(ComboItem) private readonly modelComboItem: typeof ComboItem,
        @InjectModel(CartItemComboOption) private readonly modelCartItemComboOption: typeof CartItemComboOption,
        @InjectModel(Ingredient) private readonly modelIngredient: typeof Ingredient,
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        private readonly sequelize: Sequelize
    ) { }

    async getSinglePricing(dto: GetPricingNoQuantityDto) {
        const { comboItemId, productVariantId } = dto;

        if (!productVariantId || !comboItemId) {
            throw new BadRequestException(
                'Can truyen productVariantId va comboItemId khi tinh gia doi mon trong combo'
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
            throw new BadRequestException('Khong co du lieu gia cho bien the nay');
        }

        const comboItem = await this.modelComboItem.findByPk(comboItemId, {
            include: [
                {
                    model: Combo,
                    attributes: ['id', 'name', 'price', 'discountPercentage'],
                    required: true
                },
                {
                    model: this.modelProductVariant,
                    attributes: ['id', 'modifiedPrice'],
                    required: true
                }
            ]
        });

        if (!comboItem?.dataValues.productVariant || !comboItem?.dataValues.combo) {
            throw new BadRequestException(`ComboItem with id ${comboItemId} not found!!!`);
        }

        const raw = productVariant.get({ plain: true }) as unknown as {
            product: Product & { variantPrice: number };
        };

        const comboItemVariant = comboItem.dataValues.productVariant;
        const selectedVariantId = Number(productVariant.dataValues.id || productVariantId);
        const comboItemProductVariantId = Number(comboItem.dataValues.productVariantId || comboItemVariant.id);
        const variantSurcharge = this.calculateVariantSurcharge(
            selectedVariantId,
            comboItemProductVariantId,
            Number(productVariant.dataValues.modifiedPrice || 0),
            Number(comboItemVariant.dataValues.modifiedPrice || 0)
        );

        const combo = comboItem.dataValues.combo;
        const comboContext = this.buildComboPricingContext(combo);
        const currentToppingSurcharge = await this.calculateIngredientSurcharge(dto.ingredients);
        const totalSurcharge = await this.calculateComboOptionsSurcharge(comboItem, dto);

        return {
            variantPrice: raw.product.variantPrice,
            variantSurcharge,
            toppingSurcharge: currentToppingSurcharge,
            combo: {
                id: combo.dataValues.id,
                name: combo.dataValues.name,
                basePrice: comboContext.comboBasePrice,
                discountPercentage: comboContext.comboDiscountPercentage,
                discountedBasePrice: comboContext.discountedComboBasePrice,
                totalSurcharge,
                priceAfterChange: comboContext.discountedComboBasePrice + totalSurcharge,
                originalPriceAfterChange: comboContext.comboBasePrice + totalSurcharge
            }
        };
    }

    async getSinglePricingFeature(dto: GetPricingFeatureDto) {
        const { productVariantId, productId } = dto;

        if (productVariantId && productId) {
            throw new BadRequestException(
                'Chi truyen 1 trong 2: productVariantId hoac productId'
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
                throw new BadRequestException('Khong co du lieu gia cho bien the nay');
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
                throw new BadRequestException('Khong co du lieu gia cho san pham nay');
            }

            return { variantPrice: product.dataValues.basePrice };
        }

        throw new BadRequestException(
            'Can truyen productVariantId hoac productId'
        );
    }

    private buildComboPricingContext(combo: Combo): ComboPricingContext {
        const comboBasePrice = Number(combo.dataValues.price || 0);
        const comboDiscountPercentage = Number(combo.dataValues.discountPercentage || 0);
        const discountedComboBasePrice = Math.ceil(
            (comboBasePrice * (1 - (comboDiscountPercentage / 100))) / 1000
        ) * 1000;

        return {
            comboBasePrice,
            comboDiscountPercentage,
            discountedComboBasePrice,
        };
    }

    private calculateVariantSurcharge(
        selectedVariantId: number,
        defaultVariantId: number,
        selectedModifiedPrice: number,
        defaultModifiedPrice: number
    ): number {
        if (selectedVariantId === defaultVariantId) {
            return 0;
        }

        return selectedModifiedPrice - defaultModifiedPrice;
    }

    private async calculateComboOptionsSurcharge(
        currentComboItem: ComboItem,
        dto: GetPricingNoQuantityDto
    ): Promise<number> {
        const persistedOptions = await this.loadPersistedComboOptions(dto);
        const modalOptions = this.mergeCurrentComboOption(dto, persistedOptions);
        if (modalOptions.length === 0) {
            return 0;
        }

        const comboItems = await this.modelComboItem.findAll({
            where: { comboId: currentComboItem.dataValues.comboId },
            include: [
                {
                    model: this.modelProductVariant,
                    attributes: ['id', 'modifiedPrice'],
                    required: true
                }
            ]
        });
        const comboItemMap = new Map<number, ComboItem>();
        comboItems.forEach(item => comboItemMap.set(Number(item.id), item));

        const selectedVariantIds = Array.from(new Set(
            modalOptions.map(option => Number(option.productVariantId)).filter(id => id > 0)
        ));
        const selectedVariants = await this.modelProductVariant.findAll({
            where: { id: selectedVariantIds },
            attributes: ['id', 'modifiedPrice'],
        });
        const selectedVariantMap = new Map<number, ProductVariant>();
        selectedVariants.forEach(variant => selectedVariantMap.set(Number(variant.id), variant));

        const ingredientPriceMap = await this.loadIngredientPriceMap(
            modalOptions.flatMap(option => option.ingredients || [])
        );
        let totalSurcharge = 0;

        for (const option of modalOptions) {
            const baseComboItem = comboItemMap.get(Number(option.comboItemId));
            if (!baseComboItem?.dataValues.productVariant) {
                throw new BadRequestException(`ComboItem ${option.comboItemId} khong thuoc combo hien tai`);
            }

            const selectedVariant = selectedVariantMap.get(Number(option.productVariantId));
            if (!selectedVariant) {
                throw new BadRequestException(`Khong co du lieu gia cho bien the ${option.productVariantId}`);
            }

            const defaultVariant = baseComboItem.dataValues.productVariant;
            const defaultVariantId = Number(baseComboItem.dataValues.productVariantId || defaultVariant.id);
            const selectedVariantId = Number(selectedVariant.id);
            const slotVariantSurcharge = this.calculateVariantSurcharge(
                selectedVariantId,
                defaultVariantId,
                Number(selectedVariant.dataValues.modifiedPrice || 0),
                Number(defaultVariant.dataValues.modifiedPrice || 0)
            );
            const slotToppingSurcharge = this.calculateIngredientSurchargeFromPriceMap(
                option.ingredients,
                ingredientPriceMap
            );

            totalSurcharge += slotVariantSurcharge + slotToppingSurcharge;
        }

        return totalSurcharge;
    }

    private async loadPersistedComboOptions(
        dto: GetPricingNoQuantityDto
    ): Promise<PricingComboOptionDto[]> {
        if (dto.type !== 'update' || !dto.cartItemId) {
            return [];
        }

        const options = await this.modelCartItemComboOption.findAll({
            where: { cartItemId: Number(dto.cartItemId) },
            include: [
                {
                    model: CartItemComboOptionIngredient,
                }
            ]
        });

        return options.map(option => ({
            comboItemId: Number(option.dataValues.comboItemId),
            slotIndex: Number(option.dataValues.slotIndex || 0),
            productId: Number(option.dataValues.selectedProductId),
            productVariantId: Number(option.dataValues.selectedProductVariantId),
            ingredients: (option.dataValues.ingredients || []).map(ingredient => ({
                ingredientId: Number(ingredient.dataValues.ingredientId),
                quantity: Number(ingredient.dataValues.quantity || 1),
                type: ingredient.dataValues.type as PricingIngredientOptionType,
            }))
        }));
    }

    private mergeCurrentComboOption(
        dto: GetPricingNoQuantityDto,
        persistedOptions: PricingComboOptionDto[] = []
    ): PricingComboOptionDto[] {
        const optionMap = new Map<string, PricingComboOptionDto>();

        for (const option of persistedOptions) {
            const normalizedOption = this.normalizeComboOption(option);
            optionMap.set(this.comboSlotKey(normalizedOption.comboItemId, normalizedOption.slotIndex || 0), normalizedOption);
        }

        for (const option of dto.comboOptions || []) {
            const normalizedOption = this.normalizeComboOption(option);
            optionMap.set(this.comboSlotKey(normalizedOption.comboItemId, normalizedOption.slotIndex || 0), normalizedOption);
        }

        const currentSlotIndex = Number(dto.slotIndex || 0);
        const currentKey = this.comboSlotKey(Number(dto.comboItemId), currentSlotIndex);
        const existingCurrentOption = optionMap.get(currentKey);
        optionMap.set(currentKey, {
            comboItemId: Number(dto.comboItemId),
            slotIndex: currentSlotIndex,
            productId: existingCurrentOption?.productId,
            productVariantId: Number(dto.productVariantId),
            ingredients: dto.ingredients !== undefined
                ? dto.ingredients
                : existingCurrentOption?.ingredients,
        });

        return Array.from(optionMap.values());
    }

    private normalizeComboOption(option: PricingComboOptionDto): PricingComboOptionDto {
        return {
            comboItemId: Number(option.comboItemId),
            slotIndex: Number(option.slotIndex || 0),
            productId: option.productId !== undefined ? Number(option.productId) : undefined,
            productVariantId: Number(option.productVariantId),
            ingredients: option.ingredients,
        };
    }

    private comboSlotKey(comboItemId: number, slotIndex: number): string {
        return `${comboItemId}:${slotIndex}`;
    }

    private async calculateIngredientSurcharge(
        ingredients?: PricingIngredientOptionDto[]
    ): Promise<number> {
        const ingredientPriceMap = await this.loadIngredientPriceMap(ingredients || []);
        return this.calculateIngredientSurchargeFromPriceMap(ingredients, ingredientPriceMap);
    }

    private async loadIngredientPriceMap(
        ingredients: PricingIngredientOptionDto[]
    ): Promise<Map<number, number>> {
        const ingredientIds = Array.from(new Set(
            ingredients.map(ingredient => Number(ingredient.ingredientId || 0)).filter(id => id > 0)
        ));

        if (ingredientIds.length === 0) {
            return new Map<number, number>();
        }

        const ingredientRows = await this.modelIngredient.findAll({
            where: { id: ingredientIds },
            attributes: ['id', 'price', 'isActive'],
        });
        const ingredientPriceMap = new Map<number, number>();

        for (const ingredient of ingredientRows) {
            if (ingredient.dataValues.isActive === false) {
                continue;
            }

            ingredientPriceMap.set(Number(ingredient.id), Number(ingredient.dataValues.price || 0));
        }

        return ingredientPriceMap;
    }

    private calculateIngredientSurchargeFromPriceMap(
        ingredients: PricingIngredientOptionDto[] | undefined,
        ingredientPriceMap: Map<number, number>
    ): number {
        let surcharge = 0;

        for (const ingredient of ingredients || []) {
            if (ingredient.type !== 'ADD') {
                continue;
            }

            const ingredientId = Number(ingredient.ingredientId || 0);
            const quantity = Number(ingredient.quantity || 0);
            surcharge += (ingredientPriceMap.get(ingredientId) || 0) * quantity;
        }

        return surcharge;
    }
}
