import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { ChatConversation } from './chat-conversation.model';
import { User } from './user.model';
import { Order } from './order.model';

export enum CHAT_MESSAGE_TYPE {
    TEXT = 'TEXT',
    SYSTEM = 'SYSTEM',
    IMAGE = 'IMAGE',
}

export enum CHAT_SENDER_ROLE {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

@Table
export class ChatMessage extends Model<ChatMessage> {
    declare id: number;
    declare createdAt: Date;
    declare updatedAt: Date;

    @ForeignKey(() => ChatConversation)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare conversationId: number;

    @ForeignKey(() => User)
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    declare senderId: number;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(CHAT_SENDER_ROLE)),
    })
    declare senderRole: CHAT_SENDER_ROLE;

    @Column({
        allowNull: false,
        defaultValue: CHAT_MESSAGE_TYPE.TEXT,
        type: DataType.ENUM(...Object.values(CHAT_MESSAGE_TYPE)),
    })
    declare type: CHAT_MESSAGE_TYPE;

    @Column({
        allowNull: false,
        type: DataType.TEXT,
    })
    declare content: string;

    @ForeignKey(() => Order)
    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare orderId: number | null;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare editedAt: Date | null;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare deletedAt: Date | null;

    @BelongsTo(() => ChatConversation)
    conversation!: ChatConversation;

    @BelongsTo(() => User)
    sender!: User;

    @BelongsTo(() => Order)
    order!: Order | null;
}
