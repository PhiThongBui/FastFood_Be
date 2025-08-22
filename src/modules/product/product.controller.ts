import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {

  }

  @Post('/create')
  async createProduct(@Body() createData:CreateProductDto){

    console.log(createData);
    
    return this.productService.createProduct(createData)
  }

  @Get('/getone/:id')
  async getOneProduct(@Param('id') id:number){
    return await this.productService.findOneProductById(id)
  }

}
