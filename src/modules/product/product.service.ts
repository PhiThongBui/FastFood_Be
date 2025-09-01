import { log } from 'node:console';
import { Sequelize } from 'sequelize-typescript';
import { Category, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dto/create-product.dto';
import { CategoryService } from '../category/category.service';
import { Helper } from '@/utils/helper';
import { Op } from 'sequelize';
import { filterProductDto } from './dto/filter-product.dto';
import { ConfigService } from '@nestjs/config';
import { raw } from 'express';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductVariantService } from '../product-variant/product-variant.service';
import { IngredientService } from '../ingredient/ingredient.service';
import { ProductIngredientService } from '../product-ingredient/product-ingredient.service';

@Injectable()
export class ProductService {
    constructor(
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
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
    async findOneProductById(id: number) {
        const result = await this.modelProduct.findByPk(id, {
            include: [
                {
                    model: this.modelProductVariant,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt','productId','isActive'],
                        include: [
                            [this.sequelize.literal(`"Product"."basePrice" + "variants"."modifiedPrice"`), 'variantPrice']
                        ]
                    }
                },
                {
                    model: this.modelProductIngredient,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'productId'],
                    },
                    include: [
                        {
                            model: this.modelIngredient,
                            attributes: ['name', 'description', 'imageUrl', 'price']
                        }
                    ]
                },
                {
                    model: this.modelCategory,
                    attributes: ['name', 'slug']
                }
            ]
            , attributes: ['name', 'slug', 'description', 'basePrice', 'imageUrl']
        })
        return result
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

            if (newProduct && newProduct.id || newProduct.dataValues.id) {
                const productId = newProduct.id || newProduct.dataValues.id

                const productVariants = productDto.productVariants.map((item) => (
                    {
                        ...item,
                        productId
                    }
                ))
                await this.modelProductVariant.bulkCreate(productVariants as any, { transaction })
            }


            if (newProduct && newProduct.id || newProduct.dataValues.id) {
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

                const productIngredient = productDto.productIngredients.map((productIngredient) => (
                    {
                        ...productIngredient,
                        productId
                    }
                ))

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
                        },{
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
}
