// dto/combo.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { 
  IsIn, 
  IsInt, 
  IsOptional, 
  IsString, 
  Min, 
  IsBoolean 
} from 'class-validator';

// ==================== QUERY DTO ====================
export class GetAllComboQueryDto {
  @ApiPropertyOptional({ 
    description: 'Số trang (bắt đầu từ 1)',
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là số nguyên' })
  @Min(1, { message: 'Page phải lớn hơn 0' })
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Số lượng item mỗi trang',
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn 0' })
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Trường để sắp xếp',
    enum: ['name', 'price', 'createdAt']
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'price', 'createdAt'], { 
    message: 'sortBy phải là name, price hoặc createdAt' 
  })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Thứ tự sắp xếp',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'], { 
    message: 'sortOrder phải là ASC hoặc DESC' 
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ 
    description: 'Tìm kiếm theo tên hoặc mô tả' 
  })
  @IsOptional()
  @IsString({ message: 'Search phải là chuỗi ký tự' })
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Lọc combo nổi bật' 
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isFeatured phải là boolean' })
  isFeatured?: boolean;
}

// ==================== RESPONSE DTO ====================

// Variant DTO
export class VariantComboDto {
  @ApiProperty({ example: 1, description: 'ID variant' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Nhỏ (20cm) Mỏng', description: 'Tên variant' })
  @Expose()
  name: string;

  @ApiProperty({ example: '20cm', description: 'Kích thước' })
  @Expose()
  size: string;

  @ApiProperty({ example: 'Mỏng', description: 'Loại bột' })
  @Expose()
  type: string;

  @ApiProperty({ example: 10000, description: 'Giá điều chỉnh' })
  @Expose()
  modifiedPrice: number;

  @ApiProperty({ example: 189000, description: 'Giá cuối cùng' })
  @Expose()
  variantPrice: number;
}

// Product DTO
export class ProductComboDto {
  @ApiProperty({ example: 1, description: 'ID sản phẩm' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Pizza Hải Sản Pesto', description: 'Tên sản phẩm' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'pizza-hai-san-pesto', description: 'Slug' })
  @Expose()
  slug: string;

  @ApiProperty({ example: 179000, description: 'Giá gốc' })
  @Expose()
  basePrice: number;

  @ApiProperty({ 
    example: 'Pizza với hải sản tươi ngon và sốt Pesto đặc biệt',
    description: 'Mô tả sản phẩm' 
  })
  @Expose()
  description: string;

  @ApiProperty({
    example: 'https://media.dodostatic.com/image/r:292x292/11ef93517b036e5ca67b43ca2ba0ef12.avif',
    description: 'URL ảnh sản phẩm'
  })
  @Expose()
  imageUrl: string;
}

// Combo Item DTO (Sản phẩm trong combo)
export class ComboItemDto {
  @ApiProperty({ example: 1, description: 'ID combo item' })
  @Expose()
  id: number;

  @ApiProperty({ example: 2, description: 'Số lượng' })
  @Expose()
  quantity: number;

  @ApiProperty({ type: ProductComboDto, description: 'Thông tin sản phẩm' })
  @Expose()
  @Type(() => ProductComboDto)
  product: ProductComboDto;

  @ApiProperty({ 
    type: VariantComboDto, 
    description: 'Thông tin variant',
    required: false 
  })
  @Expose()
  @Type(() => VariantComboDto)
  productVariant?: VariantComboDto;
}

// Combo DTO (Main)
export class ComboDto {
  @ApiProperty({ example: 1, description: 'ID combo' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Combo Tiết Kiệm', description: 'Tên combo' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'combo-tiet-kiem', description: 'Slug' })
  @Expose()
  slug: string;

  @ApiProperty({ 
    example: '2 Pizza cỡ lớn + 2 Nước ngọt', 
    description: 'Mô tả combo' 
  })
  @Expose()
  description: string;

  @ApiProperty({
    example: 'https://media.dodostatic.com/image/r:292x292/combo.avif',
    description: 'URL ảnh combo'
  })
  @Expose()
  imageUrl: string;

  @ApiProperty({ example: true, description: 'Combo nổi bật' })
  @Expose()
  isFeatured: boolean;

  @ApiProperty({ example: 399000, description: 'Giá combo' })
  @Expose()
  price: number;

  @ApiProperty({ 
    type: [ComboItemDto], 
    description: 'Danh sách sản phẩm trong combo' 
  })
  @Expose()
  @Type(() => ComboItemDto)
  items: ComboItemDto[];
}

// Pagination Metadata
export class PaginationMetaDto {
  @ApiProperty({ example: 50, description: 'Tổng số combo' })
  @Expose()
  total: number;

  @ApiProperty({ example: 1, description: 'Trang hiện tại' })
  @Expose()
  page: number;

  @ApiProperty({ example: 10, description: 'Số item mỗi trang' })
  @Expose()
  limit: number;

  @ApiProperty({ example: 5, description: 'Tổng số trang' })
  @Expose()
  totalPages: number;
}

// Final Response DTO
export class GetAllComboResponseDto {
  @ApiProperty({ 
    type: [ComboDto], 
    description: 'Danh sách combo' 
  })
  @Expose()
  @Type(() => ComboDto)
  data: ComboDto[];

  @ApiProperty({ 
    type: PaginationMetaDto, 
    description: 'Thông tin phân trang' 
  })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
