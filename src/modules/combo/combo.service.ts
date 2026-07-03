import { ComboItem } from '@/models/combo-item.model';
import { Combo } from '@/models/combo.model';
import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateComboDto } from './dto/create-combo.dto';
import { Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { CategoryService } from '../category/category.service';
import { Helper } from '@/utils/helper';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { GetAllComboQueryDto } from './dto/getalls.dto';

@Injectable()
export class ComboService {
    constructor(
        @InjectModel(Combo) private readonly comboModel: typeof Combo,
        @InjectModel(ComboItem) private readonly comboItemModel: typeof ComboItem,
        @InjectModel(Product) private readonly productModel: typeof Product,
        @InjectModel(ProductVariant) private readonly productVariantModel: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly productIngredientModel: typeof ProductIngredient,
        @InjectModel(Ingredient) private readonly ingredientModel: typeof Ingredient,
        private readonly categoryService: CategoryService,
        private readonly transaction: Sequelize
    ) { }
    private readonly logger = new Logger(ComboService.name);

    async createCombo(data: CreateComboDto): Promise<Combo> {
        const transaction = await this.transaction.transaction()

        try {
            const { name, description, price, imageUrl, categoryId, isFeatured, comboItems } = data

            const payload: Record<string, any> = {}
            if (categoryId) {
                const isExisted = await this.categoryService.findById(categoryId)
                if (!isExisted) throw new Error('Category not found')
                payload.categoryId = categoryId
            }
            let slug: string | undefined
            if (name) {
                payload.name = name
                slug = Helper.converttoSlug(name);
                payload.slug = slug
            }
            const existComboname = await this.findComboBySlug(slug as string)
            if (existComboname) throw new BadRequestException('Combo name existed')
            if (price < 0) throw new BadRequestException('Price must be greater than 0')
            payload.price = price
            if (description) payload.description = description
            if (isFeatured) payload.isFeatured = isFeatured
            if (!imageUrl) throw new BadRequestException('Image url is required')
            payload.imageUrl = imageUrl

            const newCombo = await this.comboModel.create(payload as any, { transaction })

            if (newCombo && newCombo.id || newCombo.dataValues.id) {

                const comboId = newCombo.id || newCombo.dataValues.id

                if (comboItems && comboItems.length > 0) {
                    for (let item of comboItems) {
                        await this.comboItemModel.create({ ...item, comboId } as ComboItem, { transaction })
                    }
                }
            }

            await transaction.commit()
            await newCombo.reload()
            return newCombo
        } catch (error: any) {
            this.logger.error(error)
            await transaction.rollback()
            throw new BadGatewayException(error.message)
        }

    }

    async findComboBySlug(slug: string) {
        return await this.comboModel.findOne({ where: { slug } })
    }

    async getAllCombos(query: GetAllComboQueryDto) {
        const {
            page,
            limit,
            sortBy,
            sortOrder,
            search,
        } = query;

        // Kiá»ƒm tra xem cÃ³ yÃªu cáº§u phÃ¢n trang khÃ´ng
        const hasPagination = page !== undefined && limit !== undefined;

        // 1. XÃ¢y dá»±ng Ä‘iá»u kiá»‡n lá»c (WHERE)
        const where: any = {
            isActive: true, // Chá»‰ láº¥y combo Ä‘ang hoáº¡t Ä‘á»™ng
        };

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // 2. XÃ¢y dá»±ng thá»© tá»± sáº¯p xáº¿p (ORDER)
        const orderArray: any[] = [
            ['isFeatured', 'DESC'], // Æ¯u tiÃªn Combo ná»•i báº­t lÃªn Ä‘áº§u
        ];

        if (sortBy && sortOrder) {
            orderArray.push([sortBy, sortOrder.toUpperCase()]);
        } else {
            orderArray.push(['createdAt', 'DESC']); // Máº·c Ä‘á»‹nh má»›i nháº¥t lÃªn trÆ°á»›c
        }

        // 3. Cáº¥u hÃ¬nh Query
        const queryOptions: any = {
            where,
            order: orderArray,
            attributes: {
                exclude: ['categoryId'] // KhÃ´ng láº¥y categoryId, nhÆ°ng VáºªN Láº¤Y price vÃ  discountPercentage
            },
            distinct: true,
        };

        if (hasPagination) {
            const offset = (page - 1) * limit;
            queryOptions.limit = limit;
            queryOptions.offset = offset;
        }

        // 4. Thá»±c thi Query
        const { count, rows: combos } = await this.comboModel.findAndCountAll(queryOptions);

        // 5. Xá»­ lÃ½ dá»¯ liá»‡u tráº£ vá» (TÃ­nh salePrice)
        const formattedCombos = combos.map(combo => {
            const plainData = combo.get({ plain: true });

            const originalPrice = plainData.price;
            const discount = plainData.discountPercentage || 0;

            // TÃ­nh giÃ¡ sau giáº£m (salePrice)
            let salePrice = originalPrice;
            if (discount > 0) {
                salePrice = originalPrice * (1 - discount / 100);
            }

            return {
                ...plainData,
                salePrice: Math.ceil(salePrice / 1000) * 1000 // LÃ m trÃ²n thÃ nh sá»‘ nguyÃªn
            };
        });

        // 6. Tráº£ vá» káº¿t quáº£ (KÃ¨m Meta phÃ¢n trang náº¿u cÃ³)
        if (hasPagination) {
            const totalPages = Math.ceil(count / limit);
            return {
                data: formattedCombos,
                meta: {
                    total: count,
                    page,
                    limit,
                    totalPages
                }
            };
        }

        // Tráº£ vá» káº¿t quáº£ (KhÃ´ng phÃ¢n trang)
        return {
            data: formattedCombos,
            meta: {
                total: count
            }
        };
    }


    async getComboById(id: number) {
        const combo = await this.comboModel.findByPk(id, {
            // âœ… 1. ThÃªm 'discountPercentage' vÃ o danh sÃ¡ch láº¥y vá»
            attributes: ['id', 'name', 'price', 'description', 'imageUrl', 'discountPercentage'],
            include: [
                {
                    model: this.comboItemModel,
                    as: 'items',
                    // ðŸ”¥ QUAN TRá»ŒNG: Giá»¯ separate: true Ä‘á»ƒ tá»‘i Æ°u query, trÃ¡nh lá»—i timeout
                    separate: true,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'comboId', 'productId', 'productVariantId', 'quantity']
                    },
                    include: [
                        {
                            model: this.productModel,
                            attributes: ['id', 'name', 'imageUrl'],
                            include: [
                                {
                                    model: this.productIngredientModel,
                                    attributes: { exclude: ['createdAt', 'updatedAt', 'productId', 'ingredientId', 'quantity'] },
                                    where: {
                                        isDefault: true
                                    },
                                    required: false,
                                    include: [{ model: this.ingredientModel, attributes: ['name'] }]
                                }
                            ]
                        },
                        {
                            model: this.productVariantModel,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt', 'productId', 'isActive'],
                            }
                        }
                    ]
                }
            ]
        });

        if (!combo) return null;

        // âœ… 2. Xá»­ lÃ½ tÃ­nh toÃ¡n salePrice
        const plainData = combo.get({ plain: true });
        
        const originalPrice = plainData.price;
        const discount = plainData.discountPercentage || 0;

        let salePrice = originalPrice;
        if (discount > 0) {
            salePrice = originalPrice * (1 - discount / 100);
        }

        return {
            ...plainData,
            salePrice: Math.ceil(salePrice / 1000) * 1000
        };
    }
}
