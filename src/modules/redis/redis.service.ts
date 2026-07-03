import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT, REDIS_KEYS, REDIS_CONFIG } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private subscriber: Redis; // â­ Redis client riÃªng cho Pub/Sub

    constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {
        // Táº¡o subscriber riÃªng (best practice cho Pub/Sub)
        this.subscriber = this.client.duplicate();
        this.setupErrorHandlers();
    }

    private setupErrorHandlers() {
        this.client.on('error', (err) => {
            this.logger.error(`Redis Client Error: ${err.message}`);
        });

        this.client.on('connect', () => {
            this.logger.log('Redis Client Connected');
        });

        this.subscriber.on('connect', () => {
            this.logger.log('Redis Subscriber Connected');
        })

        this.subscriber.on('error', (err) => {
            this.logger.error(`Redis Subscriber Error: ${err.message}`);
        });
    }

    onModuleDestroy() {
        this.client.disconnect();
        this.subscriber.disconnect();
        this.logger.log('Redis clients disconnected');
    }

    // ==================== SORTED SET OPERATIONS ====================

    /**
     * â­ ThÃªm order vÃ o Sorted Set vá»›i TTL
     * @param orderNumber - MÃ£ Ä‘Æ¡n hÃ ng (VD: "ORD1729588800")
     * @param ttlSeconds - Thá»i gian háº¿t háº¡n (default: 1200s = 20 phÃºt)
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
     * â­ XÃ³a order khá»i Sorted Set (khi Ä‘Ã£ thanh toÃ¡n)
     */
    async removePendingOrder(orderNumber: string): Promise<number> {
        const removed = await this.client.zrem(REDIS_KEYS.PENDING_ORDERS, orderNumber);

        if (removed) {
            this.logger.log(`Removed pending order: ${orderNumber}`);
        }

        return removed;
    }

    /**
     * â­ Láº¥y danh sÃ¡ch orders Ä‘Ã£ háº¿t háº¡n
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
     * â­ Xem thá»i gian háº¿t háº¡n cá»§a má»™t order
     */
    async getOrderExpiry(orderNumber: string): Promise<Date | null> {
        const score = await this.client.zscore(REDIS_KEYS.PENDING_ORDERS, orderNumber);

        if (!score) return null;

        return new Date(parseInt(score) * 1000);
    }

    // ==================== DISTRIBUTED LOCK ====================

    /**
     * â­ Acquire lock (dÃ¹ng cho IPN deduplication)
     * @returns true náº¿u lock thÃ nh cÃ´ng, false náº¿u Ä‘Ã£ cÃ³ lock
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
            this.logger.debug(`ðŸ”’ Lock acquired: ${lockKey}`);
        } else {
            this.logger.debug(`âŒ Lock already held: ${lockKey}`);
        }

        return acquired;
    }

    /**
     * â­ Release lock
     */
    async releaseLock(key: string): Promise<void> {
        const lockKey = `${REDIS_KEYS.IPN_LOCK}:${key}`;
        await this.client.del(lockKey);
        this.logger.debug(`ðŸ”“ Lock released: ${lockKey}`);
    }

    // ==================== PUB/SUB ====================

    /**
     * â­ Publish thÃ´ng bÃ¡o Ä‘Æ¡n hÃ ng má»›i
     */
    async publishNewOrder(orderData: any): Promise<void> {
        try {
            const message = JSON.stringify(orderData);

            const subscriberCount = await this.client.publish(
                REDIS_KEYS.NEW_ORDERS_CHANNEL,
                message,
            );

            this.logger.log(
                `ðŸ“¢ Published new order: ${orderData.orderNumber} (${subscriberCount} subscribers)`
            );
        } catch (error: any) {
            this.logger.error(`Failed to publish order: ${error.message}`);
            throw error;
        }
    }

    /**
     * â­ Subscribe Ä‘á»ƒ nháº­n thÃ´ng bÃ¡o Ä‘Æ¡n hÃ ng má»›i
     * @param callback - Function xá»­ lÃ½ khi nháº­n message
     */
    async subscribeNewOrders(callback: (orderData: any) => void): Promise<void> {
        await this.subscriber.subscribe(REDIS_KEYS.NEW_ORDERS_CHANNEL); // nháº­n táº¥t cáº£ message Ä‘Æ°á»£c publish lÃªn channel 'new_orders'.

        this.subscriber.on('message', (channel, message) => {
            if (channel === REDIS_KEYS.NEW_ORDERS_CHANNEL) {
                try {
                    const orderData = JSON.parse(message);
                    callback(orderData);
                } catch (error: any) {
                    this.logger.error(`Failed to parse order message: ${error.message}`);
                }
            }
        });

        this.logger.log(`ðŸ‘‚ Subscribed to ${REDIS_KEYS.NEW_ORDERS_CHANNEL}`);
    }

    async unsubscribeNewOrders(): Promise<void> {
        await this.subscriber.unsubscribe(REDIS_KEYS.NEW_ORDERS_CHANNEL);
        this.logger.log(`Unsubscribed from ${REDIS_KEYS.NEW_ORDERS_CHANNEL}`);
    }


    /**
   * â­ Generic subscribe method (cho cÃ¡c channels khÃ¡c)
   */

    async subscribeChannel(
        channel: string,
        callback: (message: string) => void
    ): Promise<void> {
        try {
            await this.subscriber.subscribe(channel);

            this.subscriber.on('message', (ch, message) => {
                if (ch === channel) {
                    callback(message);
                }
            });

            this.logger.log(`ðŸ‘‚ Subscribed to channel: ${channel}`);
        } catch (error: any) {
            this.logger.error(`Failed to subscribe to ${channel}: ${error.message}`);
            throw error;
        }
    }
    /**
     * â­ Generic publish method
     */
    async publishToChannel(channel: string, data: any): Promise<number> {
        try {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            const subscriberCount = await this.client.publish(channel, message);

            this.logger.debug(
                `ðŸ“¢ Published to ${channel} (${subscriberCount} subscribers)`
            );

            return subscriberCount;
        } catch (error: any) {
            this.logger.error(`Failed to publish to ${channel}: ${error.message}`);
            throw error;
        }
    }

    // ==================== GENERAL KEY-VALUE ====================

    /**
     * Set giÃ¡ trá»‹ vá»›i TTL (optional)
     */
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    /**
     * Get giÃ¡ trá»‹
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
     * Check key cÃ³ tá»“n táº¡i khÃ´ng
     */
    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }

    /**
     * â­ Expose raw client (cho advanced usage)
     */
    getClient(): Redis {
        return this.client;
    }


    /**
     * Set vá»›i object (tá»± Ä‘á»™ng JSON.stringify)
     */
    async setObject(key: string, value: any, ttlSeconds?: number): Promise<void> {
        const jsonString = JSON.stringify(value);
        await this.set(key, jsonString, ttlSeconds);
    }

    /**
     * Get vÃ  parse object
     */
    async getObject<T>(key: string): Promise<T | null> {
        const value = await this.get(key);
        if (!value) return null;
        
        try {
            return JSON.parse(value) as T;
        } catch (error: any) {
            this.logger.error(`Failed to parse JSON from key ${key}: ${error.message}`);
            return null;
        }
    }
    /**
     * â­ Expose subscriber client
     */
    getSubscriber(): Redis {
        return this.subscriber;
    }

    /**
     * â­ Health check
     */
    async ping(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error: any) {
            this.logger.error(`Redis ping failed: ${error.message}`);
            return false;
        }
    }
}
