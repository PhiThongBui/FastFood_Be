import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryFilterDto } from './dto/category-filter.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RolesGuard } from '@/common/guards/role.guards';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { CATEGORY_PERMISSIONS } from '@/common/constants/permissions.constant';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { ENUMROLE } from '@/models';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }


  @Post('create')
  @UseGuards(JWTGuard, RolesGuard, PermissionsGuard)
  @Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
  @Permissions(CATEGORY_PERMISSIONS.CREATE)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo danh mục' })
  @ApiResponse({ status: 201, description: 'Tạo danh mục thành công' })

  createCategory(@Body() categoryData: CreateCategoryDto) {
    return this.categoryService.createCategory(categoryData)
  }

  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiResponse({ status: 201, description: 'Cập nhật danh mục thành công' })
  @Patch('update/:id')
  @UseGuards(JWTGuard, RolesGuard, PermissionsGuard)
  @Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
  @Permissions(CATEGORY_PERMISSIONS.UPDATE)
  @ApiBearerAuth('access-token')
  updateCategory(@Body() updateCategoryDto: UpdateCategoryDto, @Param('id', ParseIntPipe) id: number) {
    return this.categoryService.updateCategory(updateCategoryDto, id)
  } //

  @Get('all')
  @ApiOperation({ summary: 'Lấy tất cả danh mục' })
  findAllCategories() {
    return this.categoryService.findAllCategories();
  }

  @Get('admin/list')
  @UseGuards(JWTGuard, RolesGuard, PermissionsGuard)
  @Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
  @Permissions(CATEGORY_PERMISSIONS.VIEW)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lấy danh sách danh mục cho admin (có filter, search, sort, pagination)' })
  getAdminCategories(@Query() query: CategoryFilterDto) {
    return this.categoryService.getAdminCategories(query);
  }

  @Get('one/:id')
  @ApiOperation({ summary: 'Lấy danh mục theo id' })
  findOneCategory(@Param('id') id: number) {
    return this.categoryService.findOneCategory(id);
  }


  @Delete('/hard-delete/:id') // Xóa mềm
  @UseGuards(JWTGuard, RolesGuard, PermissionsGuard)
  @Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
  @Permissions(CATEGORY_PERMISSIONS.UPDATE)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa mềm danh mục(trạng thái hoạt động)' })
  deleteSoftCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delHardCategory(id)
  }

  @Delete('/soft-delete/:id') // Xóa mềm
  @UseGuards(JWTGuard, RolesGuard, PermissionsGuard)
  @Roles(ENUMROLE.ADMIN, ENUMROLE.STAFF)
  @Permissions(CATEGORY_PERMISSIONS.UPDATE)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa danh mục khỏi database' })
  deleteHardCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delSoftCategory(id)
  }

}
