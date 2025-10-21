import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis-test')
export class RedisTestController {
    constructor(private readonly redisService: RedisService) { }

    @Get('ping')
    async ping() {
        const client = this.redisService.getClient();
        const result = await client.ping();
        return { message: 'Redis is working!', pong: result };
    }

    @Get('test-sorted-set')
    async testSortedSet() {
        // Thêm test order
        await this.redisService.addPendingOrder('ORD_TEST_123');

        // Lấy expiry
        const expiry = await this.redisService.getOrderExpiry('ORD_TEST_123');

        // Xóa test order
        // await this.redisService.removePendingOrder('ORD_TEST_123');

        return {
            message: 'Sorted Set test passed!',
            expiry: expiry?.toISOString(),
        };
    }

    @Get('test-lock')
    async testLock() {
        // Thử acquire lock
        const acquired1 = await this.redisService.acquireLock('test_order');
        const acquired2 = await this.redisService.acquireLock('test_order'); // Sẽ fail

        // Release lock
        await this.redisService.releaseLock('test_order');

        const acquired3 = await this.redisService.acquireLock('test_order'); // Sẽ thành công

        return {
            message: 'Lock test passed!',
            firstAttempt: acquired1,  // true
            secondAttempt: acquired2, // false
            thirdAttempt: acquired3,  // true
        };
    }

    @Get('test-pubsub')
    async testPubSub() {
        // Subscribe
        await this.redisService.subscribeNewOrders((data) => {
            console.log('📩 Received order:', data);
        });

        // Publish
        await this.redisService.publishNewOrder({
            orderNumber: 'ORD_TEST_456',
            restaurantId: 1,
            total: 100000,
        });

        return { message: 'Check console for Pub/Sub message!' };
    }

    @Get('list-pending-orders')
    async listPendingOrders() {
        const expiredOrders = await this.redisService.getExpiredOrders();
        const client = this.redisService.getClient();
        const allOrders = await client.zrange('pending_orders_ttl', 0, -1, 'WITHSCORES');

        return {
            total: allOrders.length / 2,
            expired: expiredOrders,
            all: allOrders
        };
    }
}
