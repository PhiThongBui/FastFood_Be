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

    constructor(private readonly redisService: RedisService) {}

    /**
     * â­ Khá»Ÿi táº¡o Gateway vÃ  subscribe Redis
     */
    async afterInit(_server: Server) {
        this.logger.log('ðŸ”Œ WebSocket Gateway initialized');
        
        // â­ Subscribe Redis Pub/Sub channel
        await this.subscribeToRedisChannel();
    }

    /**
     * â­ Client connected
     */
    handleConnection(client: Socket) {
        const clientId = client.id;
        this.connectedClients.set(clientId, client);
        
        this.logger.log(
            `âœ… Client connected: ${clientId} (Total: ${this.connectedClients.size})`
        );
        
        client.emit('connected', {
            message: 'Connected to notification server',
            clientId: clientId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * â­ Client disconnected
     */
    handleDisconnect(client: Socket) {
        const clientId = client.id;
        this.connectedClients.delete(clientId);
        
        this.logger.log(
            `âŒ Client disconnected: ${clientId} (Total: ${this.connectedClients.size})`
        );
    }

    /**
     * â­ Subscribe Redis channel "new_orders"
     */
    private async subscribeToRedisChannel() {
        try {
            // â­ Sá»­ dá»¥ng method subscribeNewOrders tá»« RedisService
            await this.redisService.subscribeNewOrders((orderData) => {
                this.handleNewOrderNotification(orderData);
            });

            this.logger.log('ðŸ“¡ Subscribed to Redis channel: new_orders');

        } catch (error: any) {
            this.logger.error(`Failed to subscribe Redis channel: ${error.message}`);
        }
    }

    /**
     * â­ Xá»­ lÃ½ notification tá»« Redis
     */
    private handleNewOrderNotification(orderData: any) {
        try {
            this.logger.log(`ðŸ”” New order notification: ${orderData.orderNumber}`);

            // â­ Emit Ä‘áº¿n Táº¤T Cáº¢ clients
            this.server.emit('new_order', {
                type: 'NEW_ORDER',
                data: orderData,
                timestamp: new Date().toISOString()
            });

            this.logger.log(
                `ðŸ“¤ Broadcasted to ${this.connectedClients.size} clients`
            );

        } catch (error: any) {
            this.logger.error(`Failed to handle notification: ${error.message}`);
        }
    }

    /**
     * â­ Client join room (optional - cho targeted notifications)
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
     * â­ Emit to specific room
     */
    emitToRoom(room: string, event: string, data: any) {
        this.server.to(room).emit(event, data);
        this.logger.log(`ðŸ“¤ Emitted ${event} to room: ${room}`);
    }

    /**
     * â­ Broadcast to all clients
     */
    broadcast(event: string, data: any) {
        this.server.emit(event, data);
        this.logger.log(`ðŸ“¤ Broadcasted ${event} to all clients`);
    }

    /**
     * â­ Get connected clients count
     */
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }
}
