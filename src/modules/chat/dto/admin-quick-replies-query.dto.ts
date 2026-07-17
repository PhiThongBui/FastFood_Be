import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CHAT_QUICK_REPLY_ROLE } from '@/models';
import { ChatPaginationDto } from './chat-pagination.dto';

export class AdminQuickRepliesQueryDto extends ChatPaginationDto {
    @ApiPropertyOptional({ enum: CHAT_QUICK_REPLY_ROLE, example: CHAT_QUICK_REPLY_ROLE.ADMIN })
    @IsOptional()
    @IsEnum(CHAT_QUICK_REPLY_ROLE)
    role?: CHAT_QUICK_REPLY_ROLE;

    @ApiPropertyOptional({ example: 'support' })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    categoryKey?: string;

    @ApiPropertyOptional({ example: 'xac nhan' })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    search?: string;

    @ApiPropertyOptional({ example: 'true', enum: ['true', 'false'] })
    @IsOptional()
    @Type(() => String)
    @IsIn(['true', 'false'])
    isActive?: 'true' | 'false';
}
