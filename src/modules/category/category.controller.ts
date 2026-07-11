import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }


  @Post('create')
  @ApiOperation({ summary: 'Tạo danh mục' })
  @ApiResponse({ status: 201, description: 'Tạo danh mục thành công' })

  createCategory(@Body() categoryData: CreateCategoryDto) {
    return this.categoryService.createCategory(categoryData)
  }

  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiResponse({ status: 201, description: 'Cập nhật danh mục thành công' })
  @Patch('update/:id')
  updateCategory(@Body() updateCategoryDto: UpdateCategoryDto, @Param('id', ParseIntPipe) id: number) {
    return this.categoryService.updateCategory(updateCategoryDto, id)
  } //

  @Get('all')
  @ApiOperation({ summary: 'Lấy tất cả danh mục' })
  findAllCategories() {
    return this.categoryService.findAllCategories();
  }


  @Get('one/:id')
  @ApiOperation({ summary: 'Lấy danh mục theo id' })
  findOneCategory(@Param('id') id: number) {
    return this.categoryService.findOneCategory(id);
  }


  @Delete('/hard-delete/:id') // Xóa mềm
  @ApiOperation({ summary: 'Xóa mềm danh mục(trạng thái hoạt động)' })
  deleteSoftCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delHardCategory(id)
  }

  @Delete('/soft-delete/:id') // Xóa mềm
  @ApiOperation({ summary: 'Xóa danh mục khỏi database' })
  deleteHardCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delSoftCategory(id)
  }

}
