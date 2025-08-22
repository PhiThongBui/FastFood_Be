import { Sequelize } from 'sequelize-typescript';
import { Category, Ingredient, Product, ProductIngredient, ProductVariant } from '@/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dto/create-product.dto';
import { CategoryService } from '../category/category.service';
import { Helper } from '@/utils/helper';
import { Op } from 'sequelize';

@Injectable()
export class ProductService {
    constructor(
        @InjectModel(Product) private readonly modelProduct: typeof Product,
        @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly modelProductIngredient: typeof ProductIngredient,
        @InjectModel(Ingredient) private readonly modelIngredient: typeof Ingredient,
        @InjectModel(Category) private readonly modelCategory: typeof Category,

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
                        exclude: ['createdAt', 'updatedAt'],
                        include: [
                            [this.sequelize.literal(`"Product"."basePrice" + "variants"."modifiedPrice"`), 'variantPrice']
                        ]
                    }
                },
                {
                    model: this.modelProductIngredient,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt'],
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
}
