import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT, REDIS_KEYS, REDIS_CONFIG } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private subscriber: Redis; // ⭐ Redis client riêng cho Pub/Sub

    constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {
        // Tạo subscriber riêng (best practice cho Pub/Sub)
        this.subscriber = this.client.duplicate();
        this.setupErrorHandlers();
    }

    private setupErrorHandlers() {
        this.client.on('error', (err) => {
            this.logger.error(`Redis Client Error: ${err.message}`);
        });

        this.client.on('connect', () => {
            this.logger.log('✅ Redis Client Connected');
        });

        this.subscriber.on('error', (err) => {
            this.logger.error(`Redis Subscriber Error: ${err.message}`);
        });
    }

    onModuleDestroy() {
        this.client.disconnect();
        this.subscriber.disconnect();
    }

    // ==================== SORTED SET OPERATIONS ====================

    /**
     * ⭐ Thêm order vào Sorted Set với TTL
     * @param orderNumber - Mã đơn hàng (VD: "ORD1729588800")
     * @param ttlSeconds - Thời gian hết hạn (default: 1200s = 20 phút)
     */
    async addPendingOrder(orderNumber: string, ttlSeconds?: number): Promise<void> {
        const ttl = ttlSeconds || REDIS_CONFIG.ORDER_TTL_SECONDS;
        const expiryTimestamp = Math.floor(Date.now() / 1000) + ttl;

        await this.client.zadd(
            REDIS_KEYS.PENDING_ORDERS,
            expiryTimestamp,
            orderNumber
        );

        this.logger.log(`Added pending order: ${orderNumber} (expires at ${new Date(expiryTimestamp * 1000).toISOString()})`);
    }

    /**
     * ⭐ Xóa order khỏi Sorted Set (khi đã thanh toán)
     */
    async removePendingOrder(orderNumber: string): Promise<number> {
        const removed = await this.client.zrem(REDIS_KEYS.PENDING_ORDERS, orderNumber);
        
        if (removed) {
            this.logger.log(`Removed pending order: ${orderNumber}`);
        }
        
        return removed;
    }

    /**
     * ⭐ Lấy danh sách orders đã hết hạn
     */
    async getExpiredOrders(): Promise<string[]> {
        const now = Math.floor(Date.now() / 1000);

        const expiredOrders = await this.client.zrangebyscore(
            REDIS_KEYS.PENDING_ORDERS,
            0,
            now
        );

        if (expiredOrders.length > 0) {
            this.logger.log(`Found ${expiredOrders.length} expired orders`);
        }

        return expiredOrders;
    }

    /**
     * ⭐ Xem thời gian hết hạn của một order
     */
    async getOrderExpiry(orderNumber: string): Promise<Date | null> {
        const score = await this.client.zscore(REDIS_KEYS.PENDING_ORDERS, orderNumber);
        
        if (!score) return null;
        
        return new Date(parseInt(score) * 1000);
    }

    // ==================== DISTRIBUTED LOCK ====================

    /**
     * ⭐ Acquire lock (dùng cho IPN deduplication)
     * @returns true nếu lock thành công, false nếu đã có lock
     */
    async acquireLock(key: string, ttlSeconds?: number): Promise<boolean> {
        const ttl = ttlSeconds || REDIS_CONFIG.LOCK_TTL_SECONDS;
        const lockKey = `${REDIS_KEYS.IPN_LOCK}:${key}`;

        const result = await this.client.set(
            lockKey,
            '1',
            'EX',
            ttl,
            'NX'
        );

        const acquired = result === 'OK';
        
        if (acquired) {
            this.logger.debug(`🔒 Lock acquired: ${lockKey}`);
        } else {
            this.logger.debug(`❌ Lock already held: ${lockKey}`);
        }

        return acquired;
    }

    /**
     * ⭐ Release lock
     */
    async releaseLock(key: string): Promise<void> {
        const lockKey = `${REDIS_KEYS.IPN_LOCK}:${key}`;
        await this.client.del(lockKey);
        this.logger.debug(`🔓 Lock released: ${lockKey}`);
    }

    // ==================== PUB/SUB ====================

    /**
     * ⭐ Publish thông báo đơn hàng mới
     */
    async publishNewOrder(orderData: any): Promise<void> {
        const message = JSON.stringify(orderData);
        
        await this.client.publish(REDIS_KEYS.NEW_ORDERS_CHANNEL, message);
        
        this.logger.log(`📢 Published new order: ${orderData.orderId || orderData.orderNumber}`);
    }

    /**
     * ⭐ Subscribe để nhận thông báo đơn hàng mới
     * @param callback - Function xử lý khi nhận message
     */
    async subscribeNewOrders(callback: (orderData: any) => void): Promise<void> {
        await this.subscriber.subscribe(REDIS_KEYS.NEW_ORDERS_CHANNEL);

        this.subscriber.on('message', (channel, message) => {
            if (channel === REDIS_KEYS.NEW_ORDERS_CHANNEL) {
                try {
                    const orderData = JSON.parse(message);
                    callback(orderData);
                } catch (error) {
                    this.logger.error(`Failed to parse order message: ${error.message}`);
                }
            }
        });

        this.logger.log(`👂 Subscribed to ${REDIS_KEYS.NEW_ORDERS_CHANNEL}`);
    }

    // ==================== GENERAL KEY-VALUE ====================

    /**
     * Set giá trị với TTL (optional)
     */
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    /**
     * Get giá trị
     */
    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    /**
     * Delete key
     */
    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    /**
     * Check key có tồn tại không
     */
    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }

    /**
     * ⭐ Expose raw client (cho advanced usage)
     */
    getClient(): Redis {
        return this.client;
    }
}
