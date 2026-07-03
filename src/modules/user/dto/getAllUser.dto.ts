import { ENUMROLE } from "@/models/user.model";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class GetAllUserDto {
    @ApiPropertyOptional({ description: 'Trang hiện tại (bắt đầu từ 1)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Số lượng user mỗi trang' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100) // Giới hạn để tránh overload
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (tìm theo name hoặc email và phone)' })
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
    @IsOptional()
    isActive?: boolean = true
}

export class UserDto {
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

export class UserResponseDto {
    @ApiProperty({ example: 100, description: 'Tổng số user' })
    totalCount: number
    @ApiProperty({ example: 1, description: 'Trang hiện tại' })
    pageIndex: number
    @ApiProperty({ example: 10, description: 'Số lượng mỗi trang' })
    pageSize: number
    @ApiProperty({ type: [UserDto], description: 'Data trả về' })
    data: UserDto[]
}