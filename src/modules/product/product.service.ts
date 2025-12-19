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

        if (!result) throw new NotFoundException('Không tìm thấy sản phẩm');
        const data = plainToInstance(ResponseProductDetailDto, result.get({ plain: true }), {
            excludeExtraneousValues: true,
        });
        console.log(data);

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
            }
            const product = await this.findOneProductBySlug(slug as string)
            if (product) throw new BadRequestException('Sản phẩm đã tồn tại!')

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
                    throw new BadRequestException('Có một vài biến thể bị trùng lặp size và type')
                }

                for (const variant of productDto.productVariants) {
                    const existedVariantDB = await this.productVariantService.existedProductVanriantDB(productId, variant.size, variant.type)

                    if (existedVariantDB) {
                        throw new BadRequestException(`Variant với size "${variant.size}" và type "${variant.type}" đã tồn tại cho sản phẩm này!`)
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

            await transaction.commit()
            return {
                message: 'Tạo sản phẩm thành công',
            }
        } catch (error) {
            console.log(error);
            await transaction.rollback()
            throw error
        }
    }
    async updateProduct(id: number, productDto: UpdateProductDto) {
        const transaction = await this.sequelize.transaction()
        try {
            const alreadyExistedProduct = await this.findOneProductById(id)
            if (!alreadyExistedProduct) throw new BadRequestException('Sản phẩm chưa được tìm thấy!')



            const whereClause: Record<string, any> = {}
            if (productDto.name) whereClause.name = productDto.name
            if (productDto.description) whereClause.description = productDto.description
            if (productDto.imageUrl) whereClause.imageUrl = productDto.imageUrl
            if (productDto.isFeatured) whereClause.isFeatured = productDto.isFeatured
            if (productDto.categoryId) {
                const alreadyExistedCategory = await this.categoryService.findOneCategory(productDto.categoryId as any)
                if (!alreadyExistedCategory) throw new BadRequestException('Category ứng với product chưa được tìm thấy!')
                whereClause.categoryId = productDto.categoryId
            }
            if (productDto.basePrice) whereClause.basePrice = productDto.basePrice
            await this.modelProduct.update(whereClause, { where: { id }, transaction, individualHooks: true })

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
                message: 'Chỉnh sửa sản phẩm thành công'
            }
        } catch (error) {
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

        // Return all without pagination (cũng filtered by categoryId = 1)
        return {
            data: plainProducts,
            meta: {
                total: count
            }
        };
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
