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
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            search,
            isFeatured
        } = query;

        const offset = (page - 1) * limit;

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

        if (isFeatured !== undefined) {
            where.isFeatured = isFeatured;
        }

        // Query combos with nested includes
        const { count, rows: combos } = await this.comboModel.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sortOrder]],
            attributes: {
                exclude: ['categoryId','isFeatured']
            },
            distinct: true, // Quan trọng khi có include để count đúng
        });

        // Transform to plain objects
        const plainCombos = combos.map(combo => combo.get({ plain: true }));

        // Calculate pagination metadata
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

    async getComboById(id: number) {
        return await this.comboModel.findByPk(id,{
            attributes: {
                exclude: ['categoryId','isFeatured']
            },
            include:[
                {
                    model: this.comboItemModel,
                    as: 'items',
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'comboId', 'productId', 'productVariantId', 'quantity']
                    },
                    include: [
                        {
                            model: this.productModel,
                            attributes: ['id', 'name', 'slug', 'basePrice', 'description', 'imageUrl'],
                            include: [
                                {
                                    model: this.productIngredientModel,
                                    attributes: { exclude: ['createdAt', 'updatedAt', 'productId', 'ingredientId'] },
                                    include: [{ model: this.ingredientModel, attributes: ['name', 'description', 'imageUrl', 'price'] }]
                                }
                            ]                          
                        },
                        {
                            model: this.productVariantModel,
                            attributes:{
                                exclude: ['createdAt', 'updatedAt', 'productId', 'isActive'],
                            }
                        }
                    ]
                }
            ]
        })
    }
}
