import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { SendChatMessageDto } from './send-chat-message.dto';

export class JoinConversationDto {
    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    conversationId?: number;
}

export class ChatTypingDto extends JoinConversationDto {
    @ApiPropertyOptional({ example: true })
    @Type(() => Boolean)
    @IsBoolean()
    isTyping: boolean;
}

export class SocketSendChatMessageDto extends SendChatMessageDto {
    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    conversationId?: number;
}
