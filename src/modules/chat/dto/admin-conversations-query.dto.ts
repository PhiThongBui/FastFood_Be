import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CHAT_CONVERSATION_STATUS } from '@/models';
import { ChatPaginationDto } from './chat-pagination.dto';

export class AdminConversationsQueryDto extends ChatPaginationDto {
    @ApiPropertyOptional({ example: 'dat@gmail.com' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @ApiPropertyOptional({ enum: CHAT_CONVERSATION_STATUS })
    @IsOptional()
    @IsIn(Object.values(CHAT_CONVERSATION_STATUS))
    status?: CHAT_CONVERSATION_STATUS;
}
