import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { filterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetProductFeaturedDto } from './dto/getProductFeatured';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { BestSellerDto } from './dto/bestSeller.dto';
import { filterPizzaDto } from './dto/filter-pizza.dto';
import { DataGetAllPizzaDto, GetAllPizzaResponseDto, QueryGetAllPizzaDto } from './dto/getAllPizza.dto';

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

  @Get('/getall')
  async getAllProduct(@Query() filterSearch: filterProductDto) {
    return await this.productService.findAllProducts(filterSearch)
  }

  // @Get('/get-all-pizza')
  // @ApiOperation({ summary: 'Lay danh sach san pham pizza' })
  // @ApiResponse({ status: 200, description: 'Lay danh sach san pham pizza' })
  // @ApiResponse({ status: 404, description: 'Khong tim thay san pham pizza' })
  // async getAllPizza(@Query() filterSearch: filterPizzaDto) {
  //   return await this.productService.findPizzaProducts(filterSearch)
  // }

  @Delete('/softdelete/:id')
  async softDeleteProduct(@Param('id') id: number) {
    return await this.productService.softDeteleProduct(id)
  }

  @Delete('/harddelete/:id')
  async hardDeleteProduct(@Param('id') id: number) {
    return await this.productService.hardDeleteProduct(id)
  }

  @Put('/update/:id')
  async updateProduct(@Param('id') id: number, @Body() updateData: UpdateProductDto) {
    return await this.productService.updateProduct(id, updateData)
  }

  @Get('/getfeatured')
  @Serialize(GetProductFeaturedDto)
  @ApiOperation({ summary: 'Lay danh sach san pham featured' })
  @ApiResponse({ status: 200, description: 'Lay danh sach san pham featured' })
  @ApiResponse({ status: 404, description: 'Khong tim thay san pham featured' })
  async getProductFeatured() {
    return await this.productService.getProductFeatured()
  }

  @Get('/best-seller')
  @Serialize(BestSellerDto)
  @ApiOperation({ summary: 'Lay danh sach san pham best seller' })
  @ApiResponse({ status: 200, description: 'Lay danh sach san pham best seller' })
  @ApiResponse({ status: 404, description: 'Khong tim thay san pham best seller' })
  async getProductBestSeller() {
    return await this.productService.getBestSellerProduct()
  }

  @Get('/get-all-pizza')
  @ApiOperation({ summary: 'Lay danh sach san pham pizza' })
  @ApiResponse({ status: 200, description: 'Lay danh sach san pham pizza' })
  @ApiResponse({ status: 404, description: 'Khong tim thay san pham pizza' })
  @Serialize(GetAllPizzaResponseDto)
  async getAllPizza(@Query() filterSearch: QueryGetAllPizzaDto) {
    return await this.productService.getAllPizza(filterSearch)
  }


  @Get('/get-by-id-custom/:id/combovariant')
  @ApiOperation({ summary: 'Lay danh sach variant và ingredient dùng cho combo detail' })
  @ApiResponse({ status: 200, description: 'Lay danh sach variant và ingredient' })
  @ApiResponse({ status: 404, description: 'Khong tim thay danh sach variant và ingredient' })
  async getProductByIdCustom(@Param('id') id: number) {
    return await this.productService.getProductByIdCustom(id)
  }

}
