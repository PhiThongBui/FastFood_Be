import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { filterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {

  }

  @Post('/create')
  @ApiResponse({ status: 201, description: 'Tạo user thành công.' })
  async createProduct(@Body() createData:CreateProductDto){    
    return this.productService.createProduct(createData)
  }

  @Get('/getone/:id')
  async getOneProduct(@Param('id') id:number){
    return await this.productService.findOneProductById(id)
  }

  @Get('/getall')
  async getAllProduct(@Query() filterSearch:filterProductDto){
    return await this.productService.findAllProducts(filterSearch)
  }

  @Delete('/softdelete/:id')
  async softDeleteProduct(@Param('id') id:number){
    return await this.productService.softDeteleProduct(id)
  }

  @Delete('/harddelete/:id')
  async hardDeleteProduct(@Param('id') id:number){
    return await this.productService.hardDeleteProduct(id)
  }

  @Put('/update/:id')
  async updateProduct(@Param('id') id:number, @Body() updateData:UpdateProductDto){
    return await this.productService.updateProduct(id, updateData)
  }
  
}
