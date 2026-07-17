import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum CHAT_QUICK_REPLY_ROLE {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Table
export class ChatQuickReply extends Model<ChatQuickReply> {
    declare id: number;
    declare createdAt: Date;
    declare updatedAt: Date;

    @Column({
        allowNull: false,
        type: DataType.ENUM(...Object.values(CHAT_QUICK_REPLY_ROLE)),
    })
    declare role: CHAT_QUICK_REPLY_ROLE;

    @Column({
        allowNull: false,
        type: DataType.STRING(120),
    })
    declare title: string;

    @Column({
        allowNull: false,
        type: DataType.TEXT,
    })
    declare content: string;

    @Column({
        allowNull: true,
        type: DataType.STRING(80),
    })
    declare categoryKey: string | null;

    @Column({
        allowNull: false,
        defaultValue: 0,
        type: DataType.INTEGER,
    })
    declare sortOrder: number;

    @Column({
        allowNull: false,
        defaultValue: true,
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}
