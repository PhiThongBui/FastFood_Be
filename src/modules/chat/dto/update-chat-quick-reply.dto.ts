import { PartialType } from '@nestjs/swagger';
import { CreateChatQuickReplyDto } from './create-chat-quick-reply.dto';

export class UpdateChatQuickReplyDto extends PartialType(CreateChatQuickReplyDto) {}
