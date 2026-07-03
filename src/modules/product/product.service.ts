import { Sequelize } from 'sequelize-typescript';
import { Category, Combo, ComboItem, Ingredient, Order, OrderItems, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dto/create-product.dto';
import { CategoryService } from '../category/category.service';
import { Helper } from '@/utils/helper';
import { Op } from 'sequelize';
import { filterProductDto } from './dto/filter-product.dto';
import { ConfigService } from '@nestjs/config';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductVariantService } from '../product-variant/product-variant.service';
import { IngredientService } from '../ingredient/ingredient.service';
import { ProductIngredientService } from '../product-ingredient/product-ingredient.service';
import { ResponseProductDetailDto } from './dto/getOne.dto';
import { plainToInstance } from 'class-transformer';
import { ORDERSTATUS } from '@/models/order.model';
import { filterPizzaDto } from './dto/filter-pizza.dto';
import { QueryGetAllPizzaDto } from './dto/getAllPizza.dto';

@Injectable()
export class ProductService {
    constructor(
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
        @InjectModel(Order) private readonly modelOrder: typeof Order,
        @InjectModel(Combo) private readonly modelCombo: typeof Combo,
        @InjectModel(ComboItem) private readonly modelComboItem: typeof ComboItem,
        @InjectModel(OrderItems) private readonly modelOrderItems: typeof OrderItems,
        @InjectModel(Ingredient) private readonly modelIngredient: typeof Ingredient,
        @InjectModel(Category) private readonly modelCategory: typeof Category,
        private readonly configService: ConfigService,
        private readonly productVariantService: ProductVariantService,
        private readonly IngredientService: IngredientService,
        private readonly productIngredientService: ProductIngredientService,

        private readonly categoryService: CategoryService,
        private readonly sequelize: Sequelize
    ) { }

    async findOneProductBySlug(slug: string) {
        const result = await this.modelProduct.findOne({
            where: {
                slug
            }
        })

        return result
    }
    async findOneProductById(id: number): Promise<ResponseProductDetailDto> {
        const result = await this.modelProduct.findByPk(id, {
            include: [
                {
                    model: this.modelProductVariant,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'productId', 'isActive'],
                        include: [
                            [this.sequelize.literal(`"Product"."basePrice" + "variants"."modifiedPrice"`), 'variantPrice']
                        ],
                    },
                },
                {
                    model: this.modelProductIngredient,
                    attributes: { exclude: ['createdAt', 'updatedAt', 'productId'] },
                    include: [{ model: this.modelIngredient, attributes: ['name', 'description', 'imageUrl', 'price'] }],
                },
                { model: this.modelCategory, attributes: ['name', 'slug'] },
            ],
            attributes: ['name', 'slug', 'description', 'basePrice', 'imageUrl'],
        });

        if (!result) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m');
        const data = plainToInstance(ResponseProductDetailDto, result.get({ plain: true }), {
            excludeExtraneousValues: true,
        });
        return data
    }
    async createProduct(productDto: CreateProductDto) {
        const transaction = await this.sequelize.transaction()
        try {

            const alreadyExistedCategory = await this.categoryService.findOneCategory(productDto.categoryId)
            if (!alreadyExistedCategory) throw new BadRequestException('Category á»©ng vá»›i product chÆ°a Ä‘Æ°á»£c tÃ¬m tháº¥y!')

            let slug: string | undefined
            if (productDto.name) {
                slug = Helper.converttoSlug(productDto.name)
            }
            const product = await this.findOneProductBySlug(slug as string)
            if (product) throw new BadRequestException('Sáº£n pháº©m Ä‘Ã£ tá»“n táº¡i!')

            const payload: Record<string, any> = {
                name: productDto.name,
                basePrice: productDto.basePrice,
                imageUrl: productDto.imageUrl,
                isFeatured: productDto.isFeatured ?? false,
                categoryId: productDto.categoryId,
                slug: slug
            }

            if (productDto.description) payload.description = productDto.description

            const newProduct = await this.modelProduct.create(payload as any, { transaction })

            if (newProduct && newProduct.dataValues.id && productDto.productVariants && productDto.productVariants.length > 0) {
                const productId = newProduct.id || newProduct.dataValues.id

                const variantKeys = productDto.productVariants.map((v) => `${v.size}-${v.type}`)
                const existedKeysVariant = new Set(variantKeys)

                if (variantKeys.length !== existedKeysVariant.size) {
                    throw new BadRequestException('CÃ³ má»™t vÃ i biáº¿n thá»ƒ bá»‹ trÃ¹ng láº·p size vÃ  type')
                }

                for (const variant of productDto.productVariants) {
                    const existedVariantDB = await this.productVariantService.existedProductVanriantDB(productId, variant.size, variant.type)

                    if (existedVariantDB) {
                        throw new BadRequestException(`Variant vá»›i size "${variant.size}" vÃ  type "${variant.type}" Ä‘Ã£ tá»“n táº¡i cho sáº£n pháº©m nÃ y!`)
                    }
                }

                const productVariants = productDto.productVariants.map((item) => (
                    {
                        ...item,
                        productId
                    }
                ))
                await this.modelProductVariant.bulkCreate(productVariants as any, { transaction })
            }


            if (newProduct && newProduct.dataValues.id && productDto.productIngredients && productDto.productIngredients.length > 0) {
                const productId = newProduct.id || newProduct.dataValues.id

                const ingredientIds = productDto.productIngredients.map((ingredient) => ingredient.ingredientId)
                const existedIdIngredients = new Set(ingredientIds)

                // [Op.in] NÃ³ tÆ°Æ¡ng Ä‘Æ°Æ¡ng vá»›i cÃ¢u SQL:
                // SELECT * FROM table WHERE column IN (1, 2, 3);
                const alreadyExisted = await this.modelIngredient.findAll({
                    where: {
                        id: {
                            [Op.in]: ingredientIds
                        }
                    }
                })
                if (alreadyExisted.length <= 0) {
                    throw new BadRequestException('CÃ³ má»™t vÃ i mÃ³n toping chÆ°a Ä‘Æ°á»£c tÃ¬m tháº¥y')
                }

                const finalProductIngredient = new Map()
                productDto.productIngredients.forEach((ingredients) => {
                    const key = ingredients.ingredientId

                    if (finalProductIngredient.has(key)) {
                        const foundKey = finalProductIngredient.get(key)
                        foundKey.quantity += ingredients.quantity
                    } else {
                        finalProductIngredient.set(key, {
                            ...ingredients,
                            productId
                        })
                    }
                })
                const productIngredient = Array.from(finalProductIngredient.values())
                await this.modelProductIngredient.bulkCreate(productIngredient as any, { transaction })
            }

            await transaction.commit()
            return {
                message: 'Táº¡o sáº£n pháº©m thÃ nh cÃ´ng',
            }
        } catch (error: any) {
            console.log(error);
            await transaction.rollback()
            throw error
        }
    }
    async updateProduct(id: number, productDto: UpdateProductDto) {
        const transaction = await this.sequelize.transaction()
        try {
            const alreadyExistedProduct = await this.findOneProductById(id)
            if (!alreadyExistedProduct) throw new BadRequestException('Sáº£n pháº©m chÆ°a Ä‘Æ°á»£c tÃ¬m tháº¥y!')



            const whereClause: Record<string, any> = {}
            if (productDto.name) whereClause.name = productDto.name
            if (productDto.description) whereClause.description = productDto.description
            if (productDto.imageUrl) whereClause.imageUrl = productDto.imageUrl
            if (productDto.isFeatured) whereClause.isFeatured = productDto.isFeatured
            if (productDto.categoryId) {
                const alreadyExistedCategory = await this.categoryService.findOneCategory(productDto.categoryId as any)
                if (!alreadyExistedCategory) throw new BadRequestException('Category á»©ng vá»›i product chÆ°a Ä‘Æ°á»£c tÃ¬m tháº¥y!')
                whereClause.categoryId = productDto.categoryId
            }
            if (productDto.basePrice) whereClause.basePrice = productDto.basePrice
            await this.modelProduct.update(whereClause, { where: { id }, transaction, individualHooks: true })

            if (productDto.productVariants && productDto.productVariants.length > 0) {
                for (const variantDto of productDto.productVariants) {
                    if (variantDto.id) {
                        if (variantDto.id <= 0) {
                            throw new BadRequestException('Id cá»§a biáº¿n thá»ƒ pháº£i lá»›n hÆ¡n 0')
                        }
                        await this.productVariantService.findOneProductVariant(variantDto.id, id)
                        await this.modelProductVariant.update({
                            name: variantDto.name,
                            type: variantDto.type,
                            size: variantDto.size,
                            modifiedPrice: variantDto.modifiedPrice
                        }, { where: { id: variantDto.id }, transaction })
                    }
                }
            }
            if (productDto.productIngredients && productDto.productIngredients.length > 0) {
                const productIngredientIds = productDto.productIngredients.map((ingredient) => ingredient.id)
                await this.productIngredientService.existedProductIngredient(productIngredientIds as number[])

                const ingredientIds = productDto.productIngredients.map((ingredient) => ingredient.ingredientId)
                await this.IngredientService.existedIngredient(ingredientIds as number[])
                for (const productIngredientDto of productDto.productIngredients) {
                    if (productIngredientDto.id) {
                        await this.modelProductIngredient.update({
                            quantity: productIngredientDto.quantity,
                            isDefault: productIngredientDto.isDefault,
                            ingredientId: productIngredientDto.ingredientId
                        }, {
                            where: {
                                id: productIngredientDto.id
                            }
                        })
                    }
                }
            }
            await transaction.commit()

            return {
                message: 'Chá»‰nh sá»­a sáº£n pháº©m thÃ nh cÃ´ng'
            }
        } catch (error: any) {
            console.log(error);
            await transaction.rollback()
            throw error
        }
    }
    async findAllProducts(filterSearch: filterProductDto) {
        const { name, categoryId, isFeatured, isActive, page, limit, sortBy, sortOrder, minPrice, maxPrice } = filterSearch
        const whereClause: Record<string, any> = {}

        if (name !== undefined) {
            whereClause.name = {
                [Op.iLike]: `%${name}%`
            }
        }
        if (categoryId !== undefined) whereClause.categoryId = categoryId
        if (isFeatured !== undefined) whereClause.isFeatured = isFeatured
        whereClause.isActive = true

        const currentPage = Number(page || 1)
        const limitPage = Number(limit || this.configService.get('LIMIT_PAGE') || 10)
        const offsetPage = Number(currentPage - 1) * limitPage

        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.basePrice = {}
            // gÃ¡n key [Op.gte] vÃ o basePrice => cáº§n khá»Ÿi táº¡o  whereClause.basePrice Ä‘á»ƒ trÃ¡nh undefined
            if (minPrice !== undefined) whereClause.basePrice[Op.gte] = minPrice
            if (maxPrice !== undefined) whereClause.basePrice[Op.lte] = maxPrice
        }

        let orderClause: any[]

        if (sortBy !== undefined) {
            orderClause = [[sortBy, sortOrder || "DESC"]]
        } else {
            orderClause = [["createdAt", "DESC"]]
        }

        const result = await this.modelProduct.findAndCountAll({
            where: whereClause,
            limit: limitPage,
            offset: offsetPage,
            order: orderClause,
            raw: true,
        })

        return {
            totalRecords: result.count,
            page: currentPage,
            numberData: result.rows.length,
            data: result.rows,
        }
    }

    async findPizzaProducts(filterSearch: filterPizzaDto) {
        // Force categoryId = 1 for pizza
        const pizzaFilter = {
            ...filterSearch,
            categoryId: 1  // Override to always be 1
        }

        const {
            name,
            isFeatured,
            page,
            limit,
            sortBy,
            sortOrder,
            minPrice,
            maxPrice
        } = pizzaFilter

        const whereClause: Record<string, any> = {
            categoryId: 1,  // âœ… Chá»‰ láº¥y pizza (category 1)
            isActive: true   // âœ… Chá»‰ láº¥y product active
        }

        // Search by name
        if (name !== undefined) {
            whereClause.name = {
                [Op.iLike]: `%${name}%`
            }
        }

        // Filter by isFeatured
        if (isFeatured !== undefined) {
            whereClause.isFeatured = isFeatured
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.basePrice = {}
            if (minPrice !== undefined) {
                whereClause.basePrice[Op.gte] = minPrice
            }
            if (maxPrice !== undefined) {
                whereClause.basePrice[Op.lte] = maxPrice
            }
        }

        // Pagination
        const currentPage = Number(page || 1)
        const limitPage = Number(limit || this.configService.get('LIMIT_PAGE') || 10)
        const offsetPage = (currentPage - 1) * limitPage

        // Sorting
        const orderField = sortBy || 'createdAt'
        const orderDirection = sortOrder || 'DESC'

        const result = await this.modelProduct.findAndCountAll({
            where: whereClause,
            limit: limitPage,
            offset: offsetPage,
            order: [[orderField, orderDirection]],
            distinct: true, // âœ… Quan trá»ng: Äáº£m báº£o count Ä‘Ãºng khi cÃ³ include
            attributes: {
                exclude: ['isActive', 'categoryId'],
                // âœ… Pháº£i include field dÃ¹ng trong ORDER BY náº¿u nÃ³ bá»‹ exclude
                ...(orderField === 'createdAt' && { include: ['createdAt'] })
            },
            include: [
                {
                    model: this.modelProductIngredient,
                    attributes: ['id', 'quantity', 'isDefault'],
                    include: [
                        {
                            model: this.modelIngredient,
                            attributes: ['id', 'name', 'description', 'imageUrl', 'price', 'isRequired']
                        }
                    ]
                },
                {
                    model: this.modelProductVariant,
                    as: 'variants', // âœ… Äáº£m báº£o alias Ä‘Ãºng
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'isActive', 'productId'],
                        include: [
                            [
                                this.sequelize.literal(
                                    '"Product"."basePrice" + "variants"."modifiedPrice"'
                                ),
                                'variantPrice'
                            ]
                        ]
                    }
                }
            ]
        })

        return {
            totalRecords: result.count,
            page: currentPage,
            numberData: result.rows.length,
            data: result.rows
        }
    }


    async softDeteleProduct(id: number) {
        await this.modelProduct.update({ isActive: false }, { where: { id } })
        return {
            message: 'XÃ³a sáº£n pháº©m thÃ nh cÃ´ng'
        }
    }

    async hardDeleteProduct(id: number) {
        await this.modelProduct.destroy({ where: { id } })

        return {
            message: 'XÃ³a sáº£n pháº©m thÃ nh cÃ´ng'
        }
    }

    async getProductFeatured() { // LÆ°u Ã½: Return type lÃºc nÃ y tráº£ vá» Model Sequelize, khÃ´ng pháº£i DTO
        return this.modelProduct.findAll({
            where: {
                isFeatured: true,
                isActive: true
            },
            include: [
                {
                    model: this.modelProductVariant,
                }
            ],
            order: [['createdAt', 'DESC']],
        });
    }


    async getBestSellerProduct() {
        // =================================================================
        // BÆ¯á»šC 1: GIá»® NGUYÃŠN (Logic tÃ­nh toÃ¡n Top ID khÃ´ng Ä‘á»•i)
        // =================================================================
        const [topProducts, topCombos] = await Promise.all([
            this.modelOrderItems.findAll({
                attributes: ['productId', [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold']],
                where: { comboId: null },
                include: [{ model: this.modelOrder, attributes: [], where: { orderStatus: ORDERSTATUS.DELIVERED } }],
                group: ['productId'],
                order: [[Sequelize.literal('"totalSold"'), 'DESC']],
                limit: 2,
                raw: true,
            }),
            this.modelOrderItems.findAll({
                attributes: ['comboId', [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold']],
                where: { comboId: { [Op.ne]: null } },
                include: [{ model: this.modelOrder, attributes: [], where: { orderStatus: ORDERSTATUS.DELIVERED } }],
                group: ['comboId'],
                order: [[Sequelize.literal('"totalSold"'), 'DESC']],
                limit: 1,
                raw: true,
            })
        ]);

        const productIds = topProducts.map(p => p.productId);
        const comboIds = topCombos.map(c => c.comboId);

        // =================================================================
        // BÆ¯á»šC 2: QUERY CHI TIáº¾T (ÄÃƒ UPDATE)
        // =================================================================
        const [fullProducts, fullCombos] = await Promise.all([
            // 1. Query Product láº» (Giá»¯ nguyÃªn logic cá»§a báº¡n)
            this.modelProduct.findAll({
                where: { id: { [Op.in]: productIds }, isActive: true },
                attributes: ['id', 'name', 'basePrice', 'imageUrl'],
            }),

            // 2. Query Combo (UPDATE: Láº¥y thÃªm Items -> Product -> Variant)
            // 2. Query Combo (UPDATE: ÄÃ£ thÃªm logic tÃ­nh toÃ¡n variantPrice)
            // 2. Query Combo (UPDATE: Sá»­a cáº¥u trÃºc Include Ä‘á»ƒ tÃ­nh toÃ¡n Ä‘Ãºng)
            this.modelCombo.findAll({
                where: { id: { [Op.in]: comboIds }, isActive: true },
                attributes: ['id', 'name', 'price', 'imageUrl'],
            })
        ]);

        // =================================================================
        // BÆ¯á»šC 3: Sáº®P Xáº¾P VÃ€ TRáº¢ Vá»€ (GIá»® NGUYÃŠN)
        // =================================================================
        const sortedProducts = topProducts.map(top => {
            const detail = fullProducts.find(p => p.id === top.productId);
            if (!detail) return null;
            return detail.get({ plain: true });
        }).filter(Boolean);

        const sortedCombos = topCombos.map(top => {
            const detail = fullCombos.find(c => c.id === top.comboId);
            if (!detail) return null;
            return detail.get({ plain: true });
        }).filter(Boolean);

        return {
            product: sortedProducts,
            combo: sortedCombos
        };
    }

    async getAllPizza(query: QueryGetAllPizzaDto) {
        const { page, limit, sortBy, sortOrder } = query;
        // Kiá»ƒm tra cÃ³ pagination hay khÃ´ng
        const hasPagination = page !== undefined && limit !== undefined;

        // Build where conditions - luÃ´n filter theo categoryId = 1
        const where: any = {
            isActive: true,
            categoryId: 1  // LuÃ´n filter theo category = 1
        };

        // Build order - Æ°u tiÃªn isFeatured trÆ°á»›c, sau Ä‘Ã³ má»›i sort theo cÃ¡c tiÃªu chÃ­ khÃ¡c
        const orderArray: any[] = [
            ['isFeatured', 'DESC'], // Featured items lÃªn Ä‘áº§u (true > false)
        ];

        // ThÃªm sort Ä‘á»™ng náº¿u cÃ³
        if (sortBy && sortOrder) {
            orderArray.push([sortBy, sortOrder.toUpperCase()]);
        } else {
            // Máº·c Ä‘á»‹nh sort theo createdAt DESC
            orderArray.push(['createdAt', 'DESC']);
        }

        // Build query options
        const queryOptions: any = {
            where,
            order: orderArray,
            attributes: {
                exclude: ['categoryId']
            },
            distinct: true,
        };

        // ThÃªm pagination náº¿u cÃ³
        if (hasPagination) {
            const offset = (page - 1) * limit;
            queryOptions.limit = limit;
            queryOptions.offset = offset;
        }

        // Query products
        const { count, rows: products } = await this.modelProduct.findAndCountAll(queryOptions);

        // Transform to plain objects
        const plainProducts = products.map(product => product.get({ plain: true }));
        // Return with or without pagination metadata
        if (hasPagination) {
            const totalPages = Math.ceil(count / limit);
            return {
                meta: {
                    total: count,
                    page,
                    limit,
                    totalPages
                },
                data: plainProducts
            };
        }

        // Return all without pagination (cÅ©ng filtered by categoryId = 1)
        return {
            data: plainProducts,
            meta: {
                total: count
            }
        };
    }

    async getPizzaDetailById(id: number) {
        const product = await this.modelProduct.findOne({
            where: {
                id,
                categoryId: 1,
                isActive: true
            },
            attributes: ['id', 'name', 'slug', 'description', 'basePrice', 'imageUrl', 'isFeatured'],
            include: [
                {
                    model: this.modelProductVariant,
                    as: 'variants',
                    required: false,
                    where: {
                        isActive: true
                    },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'productId', 'isComboItem'],
                        include: [
                            [
                                this.sequelize.literal(
                                    '"Product"."basePrice" + "variants"."modifiedPrice"'
                                ),
                                'variantPrice'
                            ]
                        ]
                    }
                },
                {
                    model: this.modelProductIngredient,
                    required: false,
                    attributes: ['id', 'quantity', 'isDefault'],
                    include: [
                        {
                            model: this.modelIngredient,
                            required: true,
                            where: {
                                isActive: true
                            },
                            attributes: ['id', 'name', 'description', 'imageUrl', 'price', 'isRequired']
                        }
                    ]
                },
                {
                    model: this.modelCategory,
                    attributes: ['id', 'name', 'slug']
                }
            ]
        });

        if (!product) {
            throw new NotFoundException('Khong tim thay pizza');
        }

        const plainProduct = product.get({ plain: true }) as any;
        plainProduct.variants = (plainProduct.variants || []).sort((a, b) => Number(a.id) - Number(b.id));
        plainProduct.ingredients = (plainProduct.ingredients || []).sort((a, b) => Number(a.id) - Number(b.id));

        return plainProduct;
    }


    async getProductByIdCustom(id: number) {
         return await this.modelProduct.findByPk(id, {
            attributes: [],
            include: [
                {
                    model: this.modelProductVariant,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'productId', 'isActive'],
                    }
                },
                {
                    model: this.modelProductIngredient,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'productId', 'ingredientId']
                    },
                    include: [
                        {
                            model: this.modelIngredient,
                            attributes: ['id', 'name', 'imageUrl', 'price', 'isRequired']
                        }
                    ]
                }
            ]
        });

    }


}
