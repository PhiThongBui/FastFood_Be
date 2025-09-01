import { ProductVariant } from '@/models';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectModel(ProductVariant) private readonly modelProductVariant: typeof ProductVariant
  ) { }

  async findOneProductVariant(idProductVariant: number, idProduct: number) {
    const result = await this.modelProductVariant.findOne({ where: { id: idProductVariant, productId: idProduct } });
    if (result === null) throw new BadRequestException('Product Variant chưa được tìm thấy');
    return {
      data: result
    }
  }
} 
