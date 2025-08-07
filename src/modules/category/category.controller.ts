import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }


  @Post('create')
  createCategory(@Body() categoryData: CreateCategoryDto) {
    return this.categoryService.createCategory(categoryData)
  }

  @Patch('update/:id')
  updateCategory(@Body() updateCategoryDto: UpdateCategoryDto, @Param('id', ParseIntPipe) id: number) {
    return this.categoryService.updateCategory(updateCategoryDto, id)
  }

  @Get('all')
  findAllCategories() {
    return this.categoryService.findAllCategories();
  }

  @Get('one/:id')
  findOneCategory(@Param('id') id: number) {
    return this.categoryService.findOneCategory(id);
  }

  @Delete('delete/:id') // Xóa cứng
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delCategory(id)
  }

}
