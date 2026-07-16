import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationGatewayService
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGatewayService.name);
    private connectedClients = new Map<string, Socket>();

    constructor(private readonly redisService: RedisService) { }

    /**
     * Khởi tạo Gateway và subscribe Redis
     */
    async afterInit(_server: Server) {
        this.logger.log('WebSocket Gateway initialized');

        // Subscribe Redis Pub/Sub channel
        await this.subscribeToRedisChannel();
    }

    /**
     * Client connected
     */
    handleConnection(client: Socket) {
        const clientId = client.id;
        this.connectedClients.set(clientId, client);

        this.logger.log(
            `Client connected: ${clientId} (Total: ${this.connectedClients.size})`
        );

        client.emit('connected', {
            message: 'Connected to notification server',
            clientId: clientId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Client disconnected
     */
    handleDisconnect(client: Socket) {
        const clientId = client.id;
        this.connectedClients.delete(clientId);

        this.logger.log(
            `Client disconnected: ${clientId} (Total: ${this.connectedClients.size})`
        );
    }

    /**
     * Subscribe Redis channel "new_orders"
     */
    private async subscribeToRedisChannel() {
        try {
            // Sử dụng method subscribeNewOrders từ RedisService
            await this.redisService.subscribeNewOrders((orderData) => {
                this.handleNewOrderNotification(orderData);
            });

            this.logger.log('Subscribed to Redis channel: new_orders');

        } catch (error: any) {
            this.logger.error(`Failed to subscribe Redis channel: ${error.message}`);
        }
    }

    /**
     * Xử lý notification từ Redis
     */
    private handleNewOrderNotification(orderData: any) {
        try {
            this.logger.log(`New order notification: ${orderData.orderNumber}`);

            // Emit đến TẤT CẢ clients
            this.server.emit('new_order', {
                type: 'NEW_ORDER',
                data: orderData,
                timestamp: new Date().toISOString()
            });

            this.logger.log(
                `Broadcasted to ${this.connectedClients.size} clients`
            );

        } catch (error: any) {
            this.logger.error(`Failed to handle notification: ${error.message}`);
        }
    }

    /**
     * Client join room optional, dùng cho targeted notifications
     */
    @SubscribeMessage('join_room')
    handleJoinRoom(client: Socket, payload: { room: string }) {
        const { room } = payload;
        client.join(room);

        this.logger.log(`Client ${client.id} joined room: ${room}`);

        client.emit('room_joined', {
            room: room,
            message: `Successfully joined ${room}`
        });
    }

    /**
     * Emit to specific room
     */
    emitToRoom(room: string, event: string, data: any) {
        this.server.to(room).emit(event, data);
        this.logger.log(`Emitted ${event} to room: ${room}`);
    }

    /**
     * Broadcast to all clients
     */
    broadcast(event: string, data: any) {
        this.server.emit(event, data);
        this.logger.log(`Broadcasted ${event} to all clients`);
    }

    /**
     * Get connected clients count
     */
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }
}