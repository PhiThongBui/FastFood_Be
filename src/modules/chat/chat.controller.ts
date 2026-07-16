import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { GetUser } from '@/common/decorators/user.decorator';
import { RolesGuard } from '@/common/guards/role.guards';
import { Roles } from '@/common/decorators/roles.decorator';
import { ENUMROLE } from '@/models';
import { ChatPaginationDto } from './dto/chat-pagination.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { AdminConversationsQueryDto } from './dto/admin-conversations-query.dto';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Get('me/conversation')
    @UseGuards(JWTGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy hoặc tạo conversation chat của user hiện tại' })
    async getMyConversation(@GetUser('uid') userId: number) {
        return this.chatService.getOrCreateMyConversation(userId);
    }

    @Post('me/conversation')
    @UseGuards(JWTGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Tạo conversation chat của user hiện tại nếu chưa có' })
    async openMyConversation(@GetUser('uid') userId: number) {
        return this.chatService.getOrCreateMyConversation(userId);
    }

    @Get('me/messages')
    @UseGuards(JWTGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Lấy lịch sử chat của user hiện tại' })
    async getMyMessages(
        @GetUser('uid') userId: number,
        @Query() query: ChatPaginationDto,
    ) {
        return this.chatService.getMyMessages(userId, query);
    }

    @Post('me/messages')
    @UseGuards(JWTGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'User gửi tin nhắn cho quán' })
    async sendMyMessage(
        @GetUser('uid') userId: number,
        @Body() dto: SendChatMessageDto,
    ) {
        return this.chatService.sendMessageAsUser(userId, dto);
    }

    @Post('me/read')
    @UseGuards(JWTGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'User đánh dấu conversation đã đọc' })
    async markMyConversationAsRead(@GetUser('uid') userId: number) {
        return this.chatService.markMyConversationAsRead(userId);
    }

    @Get('admin/conversations')
    @UseGuards(JWTGuard, RolesGuard)
    @Roles(ENUMROLE.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Admin lấy danh sách conversation chat' })
    async getAdminConversations(@Query() query: AdminConversationsQueryDto) {
        return this.chatService.getAdminConversations(query);
    }

    @Get('admin/conversations/:conversationId/messages')
    @UseGuards(JWTGuard, RolesGuard)
    @Roles(ENUMROLE.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Admin lấy lịch sử tin nhắn của một conversation' })
    async getAdminConversationMessages(
        @Param('conversationId', ParseIntPipe) conversationId: number,
        @Query() query: ChatPaginationDto,
    ) {
        return this.chatService.getAdminConversationMessages(conversationId, query);
    }

    @Post('admin/conversations/:conversationId/messages')
    @UseGuards(JWTGuard, RolesGuard)
    @Roles(ENUMROLE.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Admin gửi tin nhắn vào conversation' })
    async sendAdminMessage(
        @GetUser('uid') adminId: number,
        @Param('conversationId', ParseIntPipe) conversationId: number,
        @Body() dto: SendChatMessageDto,
    ) {
        return this.chatService.sendMessageAsAdmin(adminId, conversationId, dto);
    }

    @Post('admin/conversations/:conversationId/read')
    @UseGuards(JWTGuard, RolesGuard)
    @Roles(ENUMROLE.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Admin đánh dấu conversation đã đọc' })
    async markAdminConversationAsRead(
        @Param('conversationId', ParseIntPipe) conversationId: number,
    ) {
        return this.chatService.markAdminConversationAsRead(conversationId);
    }
}
