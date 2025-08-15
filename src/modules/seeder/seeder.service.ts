import { BadRequestException, Injectable } from '@nestjs/common';
import { categories, ingredients, productIngredients, products, productVariants, users } from './data/data';
import { Controller } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Address, Category, Ingredient, Product, ProductIngredient, ProductVariant, User } from '@/models';
import {  Transaction } from 'sequelize';
import * as bcrypt from 'bcryptjs'
import { Sequelize } from 'sequelize-typescript';
@Injectable()
export class SeederService {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
        @InjectModel(Product) private readonly productModel: typeof Product,
        @InjectModel(ProductVariant) private readonly productVariantModel: typeof ProductVariant,
        @InjectModel(ProductIngredient) private readonly productIngredientModel: typeof ProductIngredient,
        @InjectModel(Ingredient) private readonly ingredientModel: typeof Ingredient,
        private readonly sequelize: Sequelize

    ) { }


    private async seedUser(transaction: Transaction) {
        const userFormat = users.map((item) => {
            const hashedPassword = bcrypt.hashSync(item?.password)

            return { ...item, password: hashedPassword }
        })

        return this.userModel.bulkCreate(userFormat as any, { transaction })
    }

    private async seedCategories(transaction: Transaction) {
        return await this.categoryModel.bulkCreate(categories as any, { transaction })
    }


    private async seedProducts(transaction: Transaction) {
        return await this.productModel.bulkCreate(products as any, { transaction })
    }

    private async seedIngredients(transaction: Transaction) {
        return await this.ingredientModel.bulkCreate(ingredients as any, { transaction })
    }

    private async seedProductVariants(transaction: Transaction) {
        return await this.productVariantModel.bulkCreate(productVariants as any, { transaction })
    }

    private async seedProductIngredients(transaction: Transaction) {
        return await this.productIngredientModel.bulkCreate(productIngredients as any, { transaction })
    }

    async runAllSeeder() {
        const transaction = await this.sequelize.transaction()


        try {
            await this.seedUser(transaction)
            await this.seedCategories(transaction)
            await this.seedProducts(transaction)
            await this.seedIngredients(transaction)
            await this.seedProductVariants(transaction)
            await this.seedProductIngredients(transaction)


            await transaction.commit()

            return {
                message: "Seeder successfully!"
            }
        } catch (error) {
            await transaction.rollback()
            console.error('Seeding failed:', error);
            throw new BadRequestException('Seed Failed!')
        }
    }
}
