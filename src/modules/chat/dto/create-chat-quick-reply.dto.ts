import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CHAT_QUICK_REPLY_ROLE } from '@/models';

export class CreateChatQuickReplyDto {
    @ApiProperty({ enum: CHAT_QUICK_REPLY_ROLE, example: CHAT_QUICK_REPLY_ROLE.ADMIN })
    @IsEnum(CHAT_QUICK_REPLY_ROLE)
    role: CHAT_QUICK_REPLY_ROLE;

    @ApiProperty({ example: 'Xac nhan da nhan yeu cau' })
    @IsString()
    @MaxLength(120)
    title: string;

    @ApiProperty({ example: 'Em da ghi nhan yeu cau va se phan hoi som nhat.' })
    @IsString()
    @MaxLength(5000)
    content: string;

    @ApiPropertyOptional({ example: 'support' })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    categoryKey?: string;

    @ApiPropertyOptional({ example: 0, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
