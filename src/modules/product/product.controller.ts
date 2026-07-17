import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { filterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetProductFeaturedDto } from './dto/getProductFeatured';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { GetAllPizzaResponseDto, QueryGetAllPizzaDto } from './dto/getAllPizza.dto';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { RolesGuard } from '@/common/guards/role.guards';
import { Roles } from '@/common/decorators/roles.decorator';
import { ENUMROLE } from '@/models';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname } from 'path';

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

  @Post('/upload-image')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(ENUMROLE.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload ảnh sản phẩm' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadPath = './uploads/products';
          mkdirSync(uploadPath, { recursive: true });
          callback(null, uploadPath);
        },
        filename: (_req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `product-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
          return callback(new BadRequestException('Chi ho tro file anh'), false);
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadProductImage(@UploadedFile() file: { filename: string } | undefined, @Req() req: any) {
    if (!file) throw new BadRequestException('Image file is required');

    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/products/${file.filename}`;

    return {
      message: 'Upload product image successfully',
      data: {
        imageUrl,
      },
    };
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
