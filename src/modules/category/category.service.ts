import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from '@/models';
import { InjectModel } from '@nestjs/sequelize';
import { NotFoundError, throwError } from 'rxjs';
import { Helper } from '@/utils/helper';
import { Fn } from 'sequelize/types/utils';

@Injectable()
export class CategoryService {

    constructor(
        @InjectModel(Category) private categoryModel: typeof Category
    ) { }
    async findById(id: number) {
        const result = await this.categoryModel.findByPk(id)
        if (!result) {
            throw new NotFoundException(`Category with id ${id} not found!!!`)
        }
        return result
    }

    async createCategory(createCategoryDto: CreateCategoryDto) {
        const alreadyExitsted = await this.categoryModel.findOne({
            where: {
                slug: Helper.converttoSlug(createCategoryDto.name)
            }
        })
        if (alreadyExitsted) throw new BadRequestException('Danh mục đã tồn tại')
        await this.categoryModel.create(createCategoryDto as any)
        return { message: 'Danh mục đã được tạo thành công' }
    }

    async updateCategory(updateCategoryDto: UpdateCategoryDto, id: number) {
        const isUpdateCategory = await this.categoryModel.findByPk(id)
        if (!isUpdateCategory) throw new BadRequestException(`Không tìm thấy category với id = ${id} để update`)

       const updated = await isUpdateCategory.update(updateCategoryDto)
        console.log("updated", updated);
        
        return { message: 'Danh mục đã được cập nhật' }
    }
    async findAllCategories() {
        const data = await this.categoryModel.findAll({
            where: {
                isActive: true
            },
            order: [["sortOrder", "ASC"]],
            attributes: {
                exclude: ["createdAt", "updatedAt", "isActive"]
            }
        })
        return {
            data,
            message:"Xin tạm biệt"
        }
    }

    async findOneCategory(id: number) {
        const result = await this.categoryModel.findByPk(id, {raw:true});
        if (!result) {
            throw new NotFoundException(`Category with id ${id} not found!!!`)
        }

        return result
    }
    async delHardCategory(id: number) { //xóa cứng
        const isUpdateCategory = await this.categoryModel.findByPk(id)
        if (!isUpdateCategory) throw new BadRequestException(`Không tìm thấy category với id = ${id} để xóa`)
        await this.categoryModel.destroy({
            where: { id }, cascade: true
        })
        return { message: 'Danh mục đã được xóa' }
    }


    async delSoftCategory(id: number) { //xoas mềm
        const isUpdateCategory = await this.categoryModel.findByPk(id)
        if (!isUpdateCategory) throw new BadRequestException(`Không tìm thấy category với id = ${id} để xóa`)
        await isUpdateCategory.update({ isActive: false })

        return { message: 'Danh mục đã được xóa'}
    }
}
