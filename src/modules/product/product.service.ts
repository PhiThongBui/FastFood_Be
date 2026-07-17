import { Sequelize } from 'sequelize-typescript';
import { Category, Combo, Ingredient, Order, OrderItems, Product, ProductIngredient, ProductVariant, PRODUCTVARIANTSIZE, PRODUCTVARIANTTYPE } from '@/models';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dto/create-product.dto';
import { CategoryService } from '../category/category.service';
import { Helper } from '@/utils/helper';
import { Op, ValidationError } from 'sequelize';
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

    private async findDuplicateProductByIdentity(name: string, excludeProductId?: number) {
        const normalizedName = name.trim()
        const normalizedSlug = Helper.converttoSlug(normalizedName)

        return this.modelProduct.findOne({
            where: {
                [Op.or]: [
                    { name: normalizedName },
                    { slug: normalizedSlug }
                ],
                ...(excludeProductId ? { id: { [Op.ne]: excludeProductId } } : {})
            }
        })
    }

    private throwReadableProductUniqueError(error: unknown): never {
        if (error instanceof ValidationError) {
            const isDuplicatedProductIdentity = error.errors.some(
                (item) => item.path === 'name' || item.path === 'slug' || item.validatorKey === 'not_unique'
            )

            if (isDuplicatedProductIdentity) {
                throw new BadRequestException('Ten san pham da ton tai. Vui long chon ten khac.')
            }
        }

        throw error
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

        if (!result) throw new NotFoundException('Không tìm thấy sản phẩm');
        const data = plainToInstance(ResponseProductDetailDto, result.get({ plain: true }), {
            excludeExtraneousValues: true,
        });
        return data
    }
    async createProduct(productDto: CreateProductDto) {
        const transaction = await this.sequelize.transaction()
        try {

            const alreadyExistedCategory = await this.categoryService.findOneCategory(productDto.categoryId)
            if (!alreadyExistedCategory) throw new BadRequestException('Category ứng với product chưa được tìm thấy!')

            let slug: string | undefined
            if (productDto.name) {
                slug = Helper.converttoSlug(productDto.name)
                const duplicatedProduct = await this.findDuplicateProductByIdentity(productDto.name)
                if (duplicatedProduct) {
                    throw new BadRequestException('Ten san pham da ton tai. Vui long chon ten khac.')
                }
            }

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

            const normalizedProductVariants = productDto.productVariants?.length
                ? productDto.productVariants
                : [{
                    name: 'Mặc định',
                    size: PRODUCTVARIANTSIZE.DEFAULT,
                    type: PRODUCTVARIANTTYPE.DEFAULT,
                    modifiedPrice: 0
                }]

            if (newProduct && newProduct.dataValues.id && normalizedProductVariants.length > 0) {
                const productId = newProduct.id || newProduct.dataValues.id

                const variantKeys = normalizedProductVariants.map((v) => `${v.size}-${v.type}`)
                const existedKeysVariant = new Set(variantKeys)

                if (variantKeys.length !== existedKeysVariant.size) {
                    throw new BadRequestException('Có một vài biến thể bị trùng lặp size và type')
                }

                for (const variant of normalizedProductVariants) {
                    const existedVariantDB = await this.productVariantService.existedProductVanriantDB(productId, variant.size, variant.type)

                    if (existedVariantDB) {
                        throw new BadRequestException(`Variant với size "${variant.size}" và type "${variant.type}" đã tồn tại cho sản phẩm này!`)
                    }
                }

                const productVariants = normalizedProductVariants.map((item) => (
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
                // [Op.in] Nó tương đương với câu SQL:
                // SELECT * FROM table WHERE column IN (1, 2, 3);
                const alreadyExisted = await this.modelIngredient.findAll({
                    where: {
                        id: {
                            [Op.in]: ingredientIds
                        }
                    }
                })
                if (alreadyExisted.length <= 0) {
                    throw new BadRequestException('Có một vài món toping chưa được tìm thấy')
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

            if (newProduct && newProduct.dataValues.id && productDto.productVariants && productDto.productVariants.length > 0) {
                const productId = newProduct.id || newProduct.dataValues.id
                
                const variantsToCreate = productDto.productVariants.map(variant => ({
                    name: variant.name || productDto.name,
                    type: variant.type || PRODUCTVARIANTTYPE.DEFAULT,
                    size: variant.size || PRODUCTVARIANTSIZE.DEFAULT,
                    modifiedPrice: variant.modifiedPrice || 0,
                    isActive: (variant as any).isActive ?? true,
                    productId,
                    isComboItem: false
                }))
                
                await this.modelProductVariant.bulkCreate(variantsToCreate as any, { transaction })
            }


            await transaction.commit()
            return {
                message: 'Tạo sản phẩm thành công',
            }
        } catch (error: any) {
            console.log(error);
            await transaction.rollback()
            this.throwReadableProductUniqueError(error)
        }
    }
    
    async updateProduct(id: number, productDto: UpdateProductDto) {
        const transaction = await this.sequelize.transaction()
        try {
            const alreadyExistedProduct = await this.findOneProductById(id)
            if (!alreadyExistedProduct) throw new BadRequestException('Sản phẩm chưa được tìm thấy!')

            const whereClause: Record<string, any> = {}
            if (productDto.name !== undefined) {
                const duplicatedProduct = await this.findDuplicateProductByIdentity(productDto.name, id)
                if (duplicatedProduct) {
                    throw new BadRequestException('Ten san pham da ton tai. Vui long chon ten khac.')
                }
            }
            if (productDto.name !== undefined) whereClause.name = productDto.name
            if (productDto.description !== undefined) whereClause.description = productDto.description
            if (productDto.imageUrl !== undefined) whereClause.imageUrl = productDto.imageUrl
            if (productDto.isFeatured !== undefined) whereClause.isFeatured = productDto.isFeatured
            if (productDto.categoryId !== undefined) {
                const alreadyExistedCategory = await this.categoryService.findOneCategory(productDto.categoryId as any)
                if (!alreadyExistedCategory) throw new BadRequestException('Category ứng với product chưa được tìm thấy!')
                whereClause.categoryId = productDto.categoryId
            }
            if (productDto.basePrice !== undefined) whereClause.basePrice = productDto.basePrice
            if (productDto.isActive !== undefined) whereClause.isActive = productDto.isActive
            
            if (Object.keys(whereClause).length > 0) {
                await this.modelProduct.update(whereClause, { where: { id }, transaction, individualHooks: true })
            }

            if (productDto.productVariants && productDto.productVariants.length > 0) {
                for (const variantDto of productDto.productVariants) {
                    if (variantDto.id) {
                        if (variantDto.id <= 0) {
                            throw new BadRequestException('Id của biến thể phải lớn hơn 0')
                        }
                        await this.productVariantService.findOneProductVariant(variantDto.id, id)
                        await this.modelProductVariant.update({
                            name: variantDto.name,
                            type: variantDto.type,
                            size: variantDto.size,
                            modifiedPrice: variantDto.modifiedPrice,
                            isActive: variantDto.isActive
                        }, { where: { id: variantDto.id }, transaction })
                    } else {
                        // Create new variant if no id provided
                        await this.modelProductVariant.create({
                            name: variantDto.name || productDto.name || alreadyExistedProduct.name,
                            type: variantDto.type || PRODUCTVARIANTTYPE.DEFAULT,
                            size: variantDto.size || PRODUCTVARIANTSIZE.DEFAULT,
                            modifiedPrice: variantDto.modifiedPrice || 0,
                            isActive: variantDto.isActive ?? true,
                            productId: id,
                            isComboItem: false
                        } as any, { transaction })
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
                message: 'Chỉnh sửa sản phẩm thành công'
            }
        } catch (error: any) {
            console.log(error);
            await transaction.rollback()
            this.throwReadableProductUniqueError(error)
        }
    }

    async findAllProducts(filterSearch: filterProductDto) {
        const { name, categoryId, isFeatured, page, limit, sortBy, sortOrder, minPrice, maxPrice } = filterSearch
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
            // gán key [Op.gte] vào basePrice => cần khởi tạo  whereClause.basePrice để tránh undefined
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
            distinct: true,
            attributes: ['id', 'name', 'slug', 'description', 'basePrice', 'imageUrl', 'isFeatured', 'categoryId', 'createdAt'],
            include: [
                {
                    model: this.modelProductVariant,
                    as: 'variants',
                    required: false,
                    where: {
                        isActive: true
                    },
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
            data: result.rows.map((product) => product.get({ plain: true })),
        }
    }

    async getAdminProducts(filterSearch: filterProductDto) {
        const { name, categoryId, isFeatured, isActive, page, limit, sortBy, sortOrder } = filterSearch
        const whereClause: Record<string, any> = {}

        if (name !== undefined) {
            whereClause.name = {
                [Op.iLike]: `%${name}%`
            }
        }
        if (categoryId !== undefined) whereClause.categoryId = categoryId
        if (isFeatured !== undefined) whereClause.isFeatured = isFeatured
        if (isActive !== undefined) whereClause.isActive = isActive

        const currentPage = Number(page || 1)
        const limitPage = Number(limit || 10)
        const offsetPage = Number(currentPage - 1) * limitPage

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
            distinct: true,
            attributes: ['id', 'name', 'slug', 'description', 'basePrice', 'imageUrl', 'isFeatured', 'isActive', 'categoryId', 'createdAt'],
            include: [
                {
                    model: this.modelCategory,
                    as: 'category',
                    attributes: ['id', 'name']
                },
                {
                    model: this.modelProductVariant,
                    as: 'variants',
                    required: false
                }
            ]
        })

        return {
            items: result.rows.map((product) => product.get({ plain: true })),
            meta: {
                total: result.count,
                page: currentPage,
                limit: limitPage,
                totalPages: Math.ceil(result.count / limitPage)
            }
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
            categoryId: 1,  // ✅ Chỉ lấy pizza (category 1)
            isActive: true   // ✅ Chỉ lấy product active
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
            distinct: true, // ✅ Quan trọng: Đảm bảo count đúng khi có include
            attributes: {
                exclude: ['isActive', 'categoryId'],
                // ✅ Phải include field dùng trong ORDER BY nếu nó bị exclude
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
                    as: 'variants', // ✅ Đảm bảo alias đúng
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
            message: 'Xóa sản phẩm thành công'
        }
    }

    async hardDeleteProduct(id: number) {
        await this.modelProduct.destroy({ where: { id } })

        return {
            message: 'Xóa sản phẩm thành công'
        }
    }

    async getProductFeatured() { // Lưu ý: Return type lúc này trả về Model Sequelize, không phải DTO
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
        // BƯỚC 1: GIỮ NGUYÊN (Logic tính toán Top ID không đổi)
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
        // BƯỚC 2: QUERY CHI TIẾT (ĐÃ UPDATE)
        // =================================================================
        const [fullProducts, fullCombos] = await Promise.all([
            // 1. Query Product lẻ (Giữ nguyên logic của bạn)
            this.modelProduct.findAll({
                where: { id: { [Op.in]: productIds }, isActive: true },
                attributes: ['id', 'name', 'basePrice', 'imageUrl'],
            }),

            // 2. Query Combo (UPDATE: Lấy thêm Items -> Product -> Variant)
            // 2. Query Combo (UPDATE: Đã thêm logic tính toán variantPrice)
            // 2. Query Combo (UPDATE: Sửa cấu trúc Include để tính toán đúng)
            this.modelCombo.findAll({
                where: { id: { [Op.in]: comboIds }, isActive: true },
                attributes: ['id', 'name', 'price', 'imageUrl'],
            })
        ]);

        // =================================================================
        // BƯỚC 3: SẮP XẾP VÀ TRẢ VỀ (GIỮ NGUYÊN)
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
        // Kiểm tra có pagination hay không
        const hasPagination = page !== undefined && limit !== undefined;

        // Build where conditions - luôn filter theo categoryId = 1
        const where: any = {
            isActive: true,
            categoryId: 1  // Luôn filter theo category = 1
        };

        // Build order - ưu tiên isFeatured trước, sau đó mới sort theo các tiêu chí khác
        const orderArray: any[] = [
            ['isFeatured', 'DESC'], // Featured items lên đầu (true > false)
        ];

        // Thêm sort động nếu có
        if (sortBy && sortOrder) {
            orderArray.push([sortBy, sortOrder.toUpperCase()]);
        } else {
            // Mặc định sort theo createdAt DESC
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

        // Thêm pagination nếu có
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

