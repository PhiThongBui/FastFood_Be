import { ENUMROLE } from "@/models/user.model";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ResponseUserByIdDto {
    @ApiProperty({ example: 1, description: 'ID người dùng' })
    @Expose()
    id: number;

    @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên người dùng' })
    @Expose()
    name: string;

    @ApiProperty({ example: 'example@gmail.com', description: 'Email người dùng' })
    @Expose()
    email: string;

    @ApiProperty({ example: '0987654321', description: 'Số điện thoại (có thể null)' })
    @Expose()
    phone?: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Đường dẫn ảnh đại diện (có thể null)' })
    @Expose()
    avatar?: string;

    @ApiProperty({ enum: ENUMROLE, example: ENUMROLE.User, description: 'Vai trò người dùng' })
    @Expose()
    role: ENUMROLE;

    @ApiProperty({ example: ['DINE_IN_ORDER_CREATE'], description: 'Dynamic permissions' })
    @Expose()
    permissions: string[];

    @ApiProperty({ example: true, description: 'Trạng thái hoạt động' })
    @Expose()
    isActive: boolean;

    @ApiProperty({ example: '2025-11-08T10:00:00Z', description: 'Thời gian tạo' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ example: '2025-11-08T10:00:00Z', description: 'Thời gian cập nhật cuối' })
    @Expose()
    updatedAt: Date;
}
