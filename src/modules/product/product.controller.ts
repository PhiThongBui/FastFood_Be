import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { filterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetProductFeaturedDto } from './dto/getProductFeatured';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { GetAllPizzaResponseDto, QueryGetAllPizzaDto } from './dto/getAllPizza.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {
  }

  @Post('/create')
  @ApiOperation({ summary: 'Tạo sản phẩm với biến thể và toping(ingredient)' })
  @ApiResponse({ status: 201, description: 'Tạo sản phẩm th thành công.' })
  async createProduct(@Body() createData: CreateProductDto) {
    return this.productService.createProduct(createData)
  }

  @Get('/getone/:id')
  async getOneProduct(@Param('id') id: number) {
    return await this.productService.findOneProductById(id)
  }

  // @UseGuards(JWTGuard, RolesGuard)
  // @Roles('USER')
  @Get('/getall')
  async getAllProduct(@Query() filterSearch: filterProductDto) {
    return await this.productService.findAllProducts(filterSearch)
  }

  @Get('admin/list')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm cho admin (có filter, search, sort, pagination)' })
  getAdminProducts(@Query() query: filterProductDto) {
    return this.productService.getAdminProducts(query);
  }

  @Delete('/softdelete/:id')
  @ApiOperation({ summary: 'Xóa mềm sản phẩm' })
  @ApiResponse({ status: 200, description: 'Xóa mềm sản phẩm thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async softDeleteProduct(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.softDeteleProduct(id)
  }

  @Delete('/harddelete/:id')
  @ApiOperation({ summary: 'Xóa cứng sản phẩm' })
  @ApiResponse({ status: 200, description: 'Xóa cứng sản phẩm thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async hardDeleteProduct(@Param('id') id: number) {
    return await this.productService.hardDeleteProduct(id)
  }

  @Put('/update/:id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiResponse({ status: 200, description: 'Cập nhật sản phẩm thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async updateProduct(@Param('id') id: number, @Body() updateData: UpdateProductDto) {
    return await this.productService.updateProduct(id, updateData)
  }

  @Get('/getfeatured')
  @Serialize(GetProductFeaturedDto)
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm featured' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách sản phẩm featured' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm featured' })
  async getProductFeatured() {
    return await this.productService.getProductFeatured()
  }

  @Get('/best-seller')
  // @Serialize(BestSellerDto)
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm best seller' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách sản phẩm best seller' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm best seller' })
  async getProductBestSeller() {
    return await this.productService.getBestSellerProduct()
  }

  @Get('/get-all-pizza')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm pizza' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách sản phẩm pizza' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm pizza' })
  @Serialize(GetAllPizzaResponseDto)
  async getAllPizza(@Query() filterSearch: QueryGetAllPizzaDto) {
    return await this.productService.getAllPizza(filterSearch)
  }

  @Get('/pizza/:id')
  @ApiOperation({ summary: 'Lấy chi tiết pizza theo id' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết pizza thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy pizza' })
  async getPizzaDetailById(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.getPizzaDetailById(id)
  }

  @Get('/get-by-id-custom/:id/combovariant')
  @ApiOperation({ summary: 'Lấy danh sách variant và ingredient dùng cho combo detail' })
  @ApiResponse({ status: 200, description: 'Lấy danh sach variant và ingredient' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh sách variant và ingredient' })
  async getProductByIdCustom(@Param('id') id: number) {
    return await this.productService.getProductByIdCustom(id)
  }

}
