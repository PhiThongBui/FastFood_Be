import { BeforeUpdate, BeforeValidate, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Product } from './product.model';
import { Ingredient } from './ingredient.model';
import { Helper } from '../utils/helper'
@Table
export class Category extends Model<Category> {
    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    name: string;


    @Column({
        allowNull: false,
        type: DataType.STRING,
        unique: true
    })
    slug: string;

    @Column({
        allowNull: true,
        type: DataType.TEXT,
    })
    description: string;


    @Column({
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    sortOrder: number;

    @Column({
        defaultValue: true,
        allowNull: true,
        type: DataType.BOOLEAN,
    })
    isActive: boolean;

    //Relationship
    @HasMany(() => Product)
    products: Product[]

    @HasMany(() => Ingredient)
    ingredients: Ingredient[]


    @BeforeValidate //chạy khi tạo bản ghi mới và cũng chạy khi before update
    static makeSlug(newCategory: Category) {
        const name = newCategory.dataValues.name
        if (newCategory.isNewRecord && name) {
            const slug = Helper.converttoSlug(name)
            newCategory.setDataValue('slug', slug)
        }
    }

    @BeforeUpdate
    static updateCategory(category: Category){
        if(category.changed('name')){
            const slug = Helper.converttoSlug(category.dataValues.name)
            category.setDataValue('slug', slug)
        }
    }
}