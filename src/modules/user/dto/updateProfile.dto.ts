import { StringNotRequired } from '@/common/decorators/index'; // chỉnh lại path đúng với bạn
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @StringNotRequired
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên người dùng' })
  name?: string;

  @StringNotRequired
  @ApiProperty({ example: 'example@gmail.com', description: 'Email người dùng' })
  email?: string;

  @StringNotRequired
  @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
  phone?: string;

  @StringNotRequired
  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Đường dẫn ảnh đại diện' })
  avatar?: string;
}
