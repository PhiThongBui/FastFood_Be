import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    Table,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ChatMessage } from './chat-message.model';

export enum CHAT_CONVERSATION_STATUS {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
}

@Table
export class ChatConversation extends Model<ChatConversation> {
    declare id: number;
    declare createdAt: Date;
    declare updatedAt: Date;

    @ForeignKey(() => User)
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.INTEGER,
    })
    declare userId: number;

    @Column({
        allowNull: false,
        defaultValue: CHAT_CONVERSATION_STATUS.OPEN,
        type: DataType.ENUM(...Object.values(CHAT_CONVERSATION_STATUS)),
    })
    declare status: CHAT_CONVERSATION_STATUS;

    @Column({
        allowNull: true,
        type: DataType.INTEGER,
    })
    declare lastMessageId: number | null;

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    declare lastMessagePreview: string | null;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare lastMessageAt: Date | null;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare lastReadUserAt: Date | null;

    @Column({
        allowNull: true,
        type: DataType.DATE,
    })
    declare lastReadAdminAt: Date | null;

    @BelongsTo(() => User)
    user!: User;

    @HasMany(() => ChatMessage, {
        foreignKey: 'conversationId',
        onDelete: 'CASCADE',
        hooks: false,
    })
    messages!: ChatMessage[];
}
