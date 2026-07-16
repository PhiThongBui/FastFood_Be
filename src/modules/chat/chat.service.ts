import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
    ChatConversation,
    ChatMessage,
    CHAT_CONVERSATION_STATUS,
    CHAT_MESSAGE_TYPE,
    CHAT_SENDER_ROLE,
    ENUMROLE,
    Order,
    User,
} from '@/models';
import { AdminConversationsQueryDto } from './dto/admin-conversations-query.dto';
import { ChatPaginationDto } from './dto/chat-pagination.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { RedisService } from '../redis/redis.service';
import { REDIS_KEYS } from '../redis/redis.constants';
import { Op, WhereOptions } from 'sequelize';

export interface ChatActor {
    uid: number;
    role: ENUMROLE;
}

type ChatRedisEventType = 'chat.message.new' | 'chat.read' | 'chat.typing';

interface ChatRedisEvent {
    type: ChatRedisEventType;
    conversationId: number;
    payload: Record<string, unknown>;
    timestamp: string;
}

interface ChatConversationPlain {
    id: number;
    userId: number;
    status: CHAT_CONVERSATION_STATUS;
    lastMessageId: number | null;
    lastMessagePreview: string | null;
    lastMessageAt: Date | null;
    lastReadUserAt: Date | null;
    lastReadAdminAt: Date | null;
    user?: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        avatar: string | null;
    };
}

interface ChatMessagePlain {
    id: number;
    conversationId: number;
    senderId: number;
    senderRole: CHAT_SENDER_ROLE;
    type: CHAT_MESSAGE_TYPE;
    content: string;
    orderId: number | null;
    createdAt: Date;
    updatedAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
    order?: {
        id: number;
        orderNumber: string;
        orderStatus: string;
        paymentStatus: string;
        finalTotal: number;
    } | null;
}

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        @InjectModel(ChatConversation)
        private readonly chatConversationModel: typeof ChatConversation,
        @InjectModel(ChatMessage)
        private readonly chatMessageModel: typeof ChatMessage,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(Order)
        private readonly orderModel: typeof Order,
        private readonly redisService: RedisService,
    ) {}

    async getOrCreateMyConversation(userId: number) {
        const conversation = await this.getOrCreateConversationEntity(userId);
        const hydratedConversation = await this.getConversationById(conversation.id, true);

        return this.buildConversationSummary(hydratedConversation || conversation);
    }

    async getMyMessages(userId: number, query: ChatPaginationDto) {
        const conversation = await this.getOrCreateConversationEntity(userId);
        const pagination = this.resolvePagination(query);
        const result = await this.chatMessageModel.findAndCountAll({
            where: { conversationId: conversation.id },
            include: [this.buildOrderInclude()],
            order: [['createdAt', 'DESC']],
            limit: pagination.limit,
            offset: pagination.offset,
        });

        const summaryConversation = await this.getConversationById(conversation.id, true);

        return {
            conversation: await this.buildConversationSummary(summaryConversation || conversation),
            items: result.rows.slice().reverse().map((message) => this.serializeMessage(message)),
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                totalItems: this.resolveCount(result.count),
                totalPages: Math.ceil(this.resolveCount(result.count) / pagination.limit),
            },
        };
    }

    async sendMessageAsUser(userId: number, dto: SendChatMessageDto) {
        const conversation = await this.getOrCreateConversationEntity(userId);

        return this.createMessage({
            actorId: userId,
            senderRole: CHAT_SENDER_ROLE.USER,
            conversation,
            content: dto.content,
            orderId: dto.orderId,
        });
    }

    async markMyConversationAsRead(userId: number) {
        const conversation = await this.getOrCreateConversationEntity(userId);
        return this.markConversationAsReadInternal(conversation, CHAT_SENDER_ROLE.USER);
    }

    async getAdminConversations(query: AdminConversationsQueryDto) {
        const pagination = this.resolvePagination(query);
        const include = [this.buildUserInclude(Boolean(query.search?.trim()), query.search)];
        const where: WhereOptions<ChatConversation> = {};

        if (query.status) {
            where.status = query.status;
        }

        const result = await this.chatConversationModel.findAndCountAll({
            where,
            include,
            distinct: true,
            order: [
                ['lastMessageAt', 'DESC'],
                ['updatedAt', 'DESC'],
            ],
            limit: pagination.limit,
            offset: pagination.offset,
        });

        const items = await Promise.all(
            result.rows.map((conversation) => this.buildConversationSummary(conversation)),
        );

        return {
            items,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                totalItems: this.resolveCount(result.count),
                totalPages: Math.ceil(this.resolveCount(result.count) / pagination.limit),
            },
        };
    }

    async getAdminConversationMessages(conversationId: number, query: ChatPaginationDto) {
        const conversation = await this.getConversationById(conversationId, true);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const pagination = this.resolvePagination(query);
        const result = await this.chatMessageModel.findAndCountAll({
            where: { conversationId },
            include: [this.buildOrderInclude()],
            order: [['createdAt', 'DESC']],
            limit: pagination.limit,
            offset: pagination.offset,
        });

        return {
            conversation: await this.buildConversationSummary(conversation),
            items: result.rows.slice().reverse().map((message) => this.serializeMessage(message)),
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                totalItems: this.resolveCount(result.count),
                totalPages: Math.ceil(this.resolveCount(result.count) / pagination.limit),
            },
        };
    }

    async sendMessageAsAdmin(adminId: number, conversationId: number, dto: SendChatMessageDto) {
        const conversation = await this.getConversationById(conversationId, true);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return this.createMessage({
            actorId: adminId,
            senderRole: CHAT_SENDER_ROLE.ADMIN,
            conversation,
            content: dto.content,
            orderId: dto.orderId,
        });
    }

    async markAdminConversationAsRead(conversationId: number) {
        const conversation = await this.getConversationById(conversationId, true);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return this.markConversationAsReadInternal(conversation, CHAT_SENDER_ROLE.ADMIN);
    }

    async resolveConversationForActor(actor: ChatActor, conversationId?: number) {
        if (actor.role === ENUMROLE.ADMIN) {
            if (!conversationId) {
                throw new BadRequestException('Conversation id is required for admin');
            }

            const conversation = await this.getConversationById(conversationId, true);
            if (!conversation) {
                throw new NotFoundException('Conversation not found');
            }

            return conversation;
        }

        const conversation = await this.getOrCreateConversationEntity(actor.uid);

        if (conversationId && conversationId !== conversation.id) {
            throw new ForbiddenException('You cannot access this conversation');
        }

        return conversation;
    }

    async sendMessageFromActor(actor: ChatActor, conversationId: number | undefined, dto: SendChatMessageDto) {
        if (actor.role === ENUMROLE.ADMIN) {
            if (!conversationId) {
                throw new BadRequestException('Conversation id is required for admin');
            }

            return this.sendMessageAsAdmin(actor.uid, conversationId, dto);
        }

        return this.sendMessageAsUser(actor.uid, dto);
    }

    async markConversationAsRead(actor: ChatActor, conversationId?: number) {
        if (actor.role === ENUMROLE.ADMIN) {
            if (!conversationId) {
                throw new BadRequestException('Conversation id is required for admin');
            }

            return this.markAdminConversationAsRead(conversationId);
        }

        return this.markMyConversationAsRead(actor.uid);
    }

    async publishTypingEvent(actor: ChatActor, conversationId: number | undefined, isTyping: boolean) {
        const conversation = await this.resolveConversationForActor(actor, conversationId);

        await this.publishChatEvent('chat.typing', conversation.id, {
            conversationId: conversation.id,
            userId: actor.uid,
            role: actor.role,
            isTyping,
        });

        return {
            conversationId: conversation.id,
            isTyping,
        };
    }

    private async createMessage({
        actorId,
        senderRole,
        conversation,
        content,
        orderId,
    }: {
        actorId: number;
        senderRole: CHAT_SENDER_ROLE;
        conversation: ChatConversation;
        content: string;
        orderId?: number;
    }) {
        const normalizedContent = content?.trim();
        if (!normalizedContent) {
            throw new BadRequestException('Message content is required');
        }

        let linkedOrder: Order | null = null;
        if (orderId) {
            linkedOrder = await this.validateLinkedOrder(orderId, conversation.userId);
        }

        const message = await this.chatMessageModel.create({
            conversationId: conversation.id,
            senderId: actorId,
            senderRole,
            type: CHAT_MESSAGE_TYPE.TEXT,
            content: normalizedContent,
            orderId: linkedOrder ? Number(linkedOrder.get('id')) : null,
        } as ChatMessage);

        const sentAt = message.createdAt || new Date();
        const updatePayload: Partial<ChatConversation> = {
            status: CHAT_CONVERSATION_STATUS.OPEN,
            lastMessageId: message.id,
            lastMessageAt: sentAt,
            lastMessagePreview: this.buildMessagePreview(normalizedContent),
        };

        if (senderRole === CHAT_SENDER_ROLE.USER) {
            updatePayload.lastReadUserAt = sentAt;
        } else {
            updatePayload.lastReadAdminAt = sentAt;
        }

        await conversation.update(updatePayload);

        const hydratedMessage = await this.chatMessageModel.findByPk(message.id, {
            include: [this.buildOrderInclude()],
        });
        const updatedConversation = await this.getConversationById(conversation.id, true);

        await this.publishChatEvent('chat.message.new', conversation.id, {
            message: this.serializeMessage(hydratedMessage || message),
            conversation: updatedConversation
                ? await this.buildConversationSummary(updatedConversation)
                : await this.buildConversationSummary(conversation),
        });

        return this.serializeMessage(hydratedMessage || message);
    }

    private async markConversationAsReadInternal(
        conversation: ChatConversation,
        readerRole: CHAT_SENDER_ROLE,
    ) {
        const readAt = new Date();
        const updatePayload: Partial<ChatConversation> =
            readerRole === CHAT_SENDER_ROLE.USER
                ? { lastReadUserAt: readAt }
                : { lastReadAdminAt: readAt };

        await conversation.update(updatePayload);

        const updatedConversation = await this.getConversationById(conversation.id, true);

        await this.publishChatEvent('chat.read', conversation.id, {
            conversationId: conversation.id,
            readBy: readerRole,
            readAt: readAt.toISOString(),
            conversation: updatedConversation
                ? await this.buildConversationSummary(updatedConversation)
                : await this.buildConversationSummary(conversation),
        });

        return {
            conversationId: conversation.id,
            readBy: readerRole,
            readAt,
        };
    }

    private async getOrCreateConversationEntity(userId: number) {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const existingConversation = await this.chatConversationModel.findOne({
            where: { userId },
            include: [this.buildUserInclude()],
        });

        if (existingConversation) {
            return existingConversation;
        }

        return this.chatConversationModel.create({
            userId,
            status: CHAT_CONVERSATION_STATUS.OPEN,
            lastReadUserAt: new Date(),
        } as ChatConversation);
    }

    private async getConversationById(conversationId: number, includeUser = false) {
        return this.chatConversationModel.findByPk(conversationId, {
            include: includeUser ? [this.buildUserInclude()] : undefined,
        });
    }

    private async validateLinkedOrder(orderId: number, expectedUserId: number) {
        const order = await this.orderModel.findByPk(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.userId !== expectedUserId) {
            throw new ForbiddenException('Order does not belong to this conversation');
        }

        return order;
    }

    private async buildConversationSummary(conversation: ChatConversation) {
        const plainConversation = conversation.get({ plain: true }) as ChatConversationPlain;
        const user = plainConversation.user;
        const unreadCountForUser = await this.countUnreadMessages(
            conversation.id,
            plainConversation.lastReadUserAt,
            CHAT_SENDER_ROLE.ADMIN,
        );
        const unreadCountForAdmin = await this.countUnreadMessages(
            conversation.id,
            plainConversation.lastReadAdminAt,
            CHAT_SENDER_ROLE.USER,
        );

        return {
            id: plainConversation.id,
            userId: plainConversation.userId,
            status: plainConversation.status,
            lastMessageId: plainConversation.lastMessageId,
            lastMessagePreview: plainConversation.lastMessagePreview,
            lastMessageAt: plainConversation.lastMessageAt,
            lastReadUserAt: plainConversation.lastReadUserAt,
            lastReadAdminAt: plainConversation.lastReadAdminAt,
            unreadCountForUser,
            unreadCountForAdmin,
            user: user
                ? {
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      phone: user.phone,
                      avatar: user.avatar,
                  }
                : undefined,
        };
    }

    private serializeMessage(message: ChatMessage) {
        const plainMessage = message.get({ plain: true }) as ChatMessagePlain;
        const order = plainMessage.order;

        return {
            id: plainMessage.id,
            conversationId: plainMessage.conversationId,
            senderId: plainMessage.senderId,
            senderRole: plainMessage.senderRole,
            type: plainMessage.type,
            content: plainMessage.content,
            orderId: plainMessage.orderId,
            createdAt: plainMessage.createdAt,
            updatedAt: plainMessage.updatedAt,
            editedAt: plainMessage.editedAt,
            deletedAt: plainMessage.deletedAt,
            order: order
                ? {
                      id: order.id,
                      orderNumber: order.orderNumber,
                      orderStatus: order.orderStatus,
                      paymentStatus: order.paymentStatus,
                      finalTotal: order.finalTotal,
                  }
                : null,
        };
    }

    private async countUnreadMessages(
        conversationId: number,
        lastReadAt: Date | null,
        senderRole: CHAT_SENDER_ROLE,
    ) {
        const where: Record<string, unknown> = {
            conversationId,
            senderRole,
        };

        if (lastReadAt) {
            where.createdAt = {
                [Op.gt]: lastReadAt,
            };
        }

        return this.chatMessageModel.count({
            where,
        });
    }

    private buildMessagePreview(content: string) {
        const normalized = content.replace(/\s+/g, ' ').trim();

        if (normalized.length <= 120) {
            return normalized;
        }

        return `${normalized.slice(0, 117)}...`;
    }

    private resolvePagination(query: ChatPaginationDto) {
        const page = Math.max(Number(query.page || 1), 1);
        const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
        const offset = (page - 1) * limit;

        return {
            page,
            limit,
            offset,
        };
    }

    private resolveCount(count: number | number[]) {
        return Array.isArray(count) ? count.length : count;
    }

    private buildUserInclude(required = false, search?: string) {
        const normalizedSearch = search?.trim();
        if (!normalizedSearch) {
            return {
                model: User,
                attributes: ['id', 'name', 'email', 'phone', 'avatar'],
                required,
            };
        }

        const searchPattern = `%${normalizedSearch}%`;

        return {
            model: User,
            attributes: ['id', 'name', 'email', 'phone', 'avatar'],
            required: true,
            where: {
                [Op.or]: [
                    { name: { [Op.like]: searchPattern } },
                    { email: { [Op.like]: searchPattern } },
                    { phone: { [Op.like]: searchPattern } },
                ],
            },
        };
    }

    private buildOrderInclude() {
        return {
            model: Order,
            required: false,
            attributes: ['id', 'orderNumber', 'orderStatus', 'paymentStatus', 'finalTotal'],
        };
    }

    private async publishChatEvent(
        type: ChatRedisEventType,
        conversationId: number,
        payload: Record<string, unknown>,
    ) {
        const event: ChatRedisEvent = {
            type,
            conversationId,
            payload,
            timestamp: new Date().toISOString(),
        };

        try {
            await this.redisService.publishToChannel(REDIS_KEYS.CHAT_EVENTS_CHANNEL, event);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown publish error';
            this.logger.error(`Failed to publish chat event ${type}: ${errorMessage}`);
        }
    }
}
