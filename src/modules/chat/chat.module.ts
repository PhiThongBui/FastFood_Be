import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatConversation, ChatMessage, ChatQuickReply, Order, User } from '@/models';
import { RolesGuard } from '@/common/guards/role.guards';

@Module({
    imports: [SequelizeModule.forFeature([ChatConversation, ChatMessage, ChatQuickReply, User, Order])],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway, RolesGuard],
    exports: [ChatService],
})
export class ChatModule {}
