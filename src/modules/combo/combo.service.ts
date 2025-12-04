import { ComboItem } from '@/models/combo-item.model';
import { Combo } from '@/models/combo.model';
import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateComboDto } from './dto/create-combo.dto';
import { Category, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
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
        @InjectModel(Category) private readonly categoryModel: typeof Category,
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
        } catch (error) {
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
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            search,
        } = query;

        const hasPagination = page !== undefined && limit !== undefined;

        // Build where conditions
        const where: any = {
            isActive: true
        };

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Build query options
        const queryOptions: any = {
            where,
            order: [[sortBy, sortOrder]],
            attributes: {
                exclude: ['categoryId', 'isFeatured']
            },
            distinct: true,
        };

        if (hasPagination) {
            const offset = (page - 1) * limit;
            queryOptions.limit = limit;
            queryOptions.offset = offset;
        }

        const { count, rows: combos } = await this.comboModel.findAndCountAll(queryOptions);
        const plainCombos = combos.map(combo => combo.get({ plain: true }));

        if (hasPagination) {
            const totalPages = Math.ceil(count / limit);
            return {
                data: plainCombos,
                meta: {
                    total: count,
                    page,
                    limit,
                    totalPages
                }
            };
        }

        return {
            data: plainCombos,
            meta: {
                total: count
            }
        };
    }


    async getComboById(id: number) {
        return await this.comboModel.findByPk(id, {
            attributes: [],
            include: [
                {
                    model: this.comboItemModel,
                    as: 'items',
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
                                        isDefault: true  // ✅ Thêm filter isDefault = true
                                    },
                                    required: false,  // ✅ LEFT JOIN để không bỏ product không có ingredient default
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
        })
    }
}
