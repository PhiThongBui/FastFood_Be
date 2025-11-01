import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Order, ORDERSTATUS, PAYMENTSTATUS } from '@/models/order.model';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrderCancellationService {
    private readonly logger = new Logger(OrderCancellationService.name);

    constructor(
        @InjectModel(Order) private orderModel: typeof Order,
        private readonly redisService: RedisService,
        private readonly mailService: MailService
    ) { }

    /**
     * ⭐ Cron job chạy mỗi 1 phút để hủy orders hết hạn
     * Cron expression: '0 * * * * *' = mỗi phút tại giây thứ 0
     */
    @Cron('0 * * * * *') // Mỗi 1 phút
    // @Cron('*/30 * * * * *') // Hoặc mỗi 30 giây (test)
    async handleExpiredOrders() {
        const startTime = Date.now();
        this.logger.log('🔄 Starting expired orders cancellation job...');

        try {
            // ⭐ BƯỚC 1: Lấy danh sách orders hết hạn từ Redis
            const expiredOrderNumbers = await this.redisService.getExpiredOrders();

            if (expiredOrderNumbers.length === 0) {
                this.logger.log('✅ No expired orders found');
                return;
            }

            this.logger.log(`📋 Found ${expiredOrderNumbers.length} expired orders`);

            // ⭐ BƯỚC 2: Xử lý từng order
            const results = {
                cancelled: 0,
                alreadyPaid: 0,
                alreadyCancelled: 0,
                errors: 0,
            };

            for (const orderNumber of expiredOrderNumbers) {
                try {
                    const result = await this.cancelExpiredOrder(orderNumber);

                    if (result === 'cancelled') results.cancelled++;
                    else if (result === 'already_paid') results.alreadyPaid++;
                    else if (result === 'already_cancelled') results.alreadyCancelled++;

                } catch (error) {
                    this.logger.error(`Failed to cancel order ${orderNumber}: ${error.message}`);
                    results.errors++
                }
            }

            // ⭐ BƯỚC 3: Log kết quả
            const duration = Date.now() - startTime;
            this.logger.log(
                `✅ Cancellation job completed in ${duration}ms | ` +
                `Cancelled: ${results.cancelled}, ` +
                `Already Paid: ${results.alreadyPaid}, ` +
                `Already Cancelled: ${results.alreadyCancelled}, ` +
                `Errors: ${results.errors}`
            );

        } catch (error) {
            this.logger.error(`Cancellation job failed: ${error.message}`)
        }
    }

    /**
     * ⭐ Hủy một order cụ thể
     */
    private async cancelExpiredOrder(
        orderNumber: string
    ): Promise<'cancelled' | 'already_paid' | 'already_cancelled' | 'error'> {

        this.logger.debug(`Processing order: ${orderNumber}`);

        // ⭐ BƯỚC 1: Acquire distributed lock
        const lockAcquired = await this.redisService.acquireLock(
            `cancel_${orderNumber}`,
            30 // 30 seconds TTL
        );

        if (!lockAcquired) {
            this.logger.warn(`Lock already held for ${orderNumber}, skipping...`);
            return 'error';
        }

        try {
            // ⭐ BƯỚC 2: Lấy order từ database
            const order = await this.orderModel.findOne({
                where: { orderNumber },
            });

            if (!order) {
                this.logger.warn(`Order ${orderNumber} not found in database`);
                await this.redisService.removePendingOrder(orderNumber);
                return 'error';
            }

            // ⭐ BƯỚC 3: Check payment status
            if (order.paymentStatus === PAYMENTSTATUS.PAID) {
                this.logger.log(`Order ${orderNumber} already paid, removing from Redis`);
                await this.redisService.removePendingOrder(orderNumber);
                return 'already_paid';
            }

            // ⭐ BƯỚC 4: Check order status
            if (order.orderStatus === ORDERSTATUS.CANCELLED) {
                this.logger.log(`Order ${orderNumber} already cancelled`);
                await this.redisService.removePendingOrder(orderNumber);
                return 'already_cancelled';
            }

            // ⭐ BƯỚC 5: Update order status to CANCELLED
            await order.update({
                orderStatus: ORDERSTATUS.CANCELLED,
                paymentStatus: PAYMENTSTATUS.FAILED,
                cancelledAt: new Date(),
                cancelReason: 'Payment timeout - Order expired after 20 minutes',
            } as Partial<Order>);

            this.logger.log(`✅ Order ${orderNumber} cancelled successfully`);

            // ⭐ BƯỚC 6: Remove from Redis
            await this.redisService.removePendingOrder(orderNumber);
            this.logger.debug(`Removed ${orderNumber} from Redis pending list`);

            // ⭐ BƯỚC 7: Send notification (optional - implement later)
            await this.sendCancellationEmail(order);

            return 'cancelled';

        } catch (error) {
            this.logger.error(`Error cancelling order ${orderNumber}: ${error.message}`);
            return 'error';

        } finally {
            // ⭐ BƯỚC 8: Release lock
            await this.redisService.releaseLock(`cancel_${orderNumber}`);
        }
    }

    /**
     * ⭐ Gửi thông báo hủy đơn (optional - implement later)
     */
    private async sendCancellationEmail(order: Order): Promise<void> {
        try {
            // Lấy user email
            const userEmail = order.dataValues.user?.email;
            const userName = order.dataValues.user?.name || 'Khách hàng';

            if (!userEmail) {
                this.logger.warn(`No email found for order ${order.dataValues.orderNumber}`);
                return;
            }

            // Format giá tiền
            const totalAmount = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(order.dataValues.finalTotal);

            const cancelledAt = order.dataValues.cancelledAt
                ? order.dataValues.cancelledAt.toISOString()
                : '';

            const cancelReason = order.dataValues.cancelledReason || 'Hết hạn đơn hàng';
            // Gửi email
            await this.mailService.sendOrderCancellationEmail(
                userEmail,
                userName,
                order.dataValues.orderNumber,
                totalAmount,
                order.dataValues.createdAt.toISOString(),
                cancelledAt,
                cancelReason,
            );

        } catch (error) {
            this.logger.error(`Error sending cancellation email: ${error.message}`);
            throw error;
        }
    }

    /**
     * ⭐ Manual trigger để test (optional)
     */
    async manualCancelExpiredOrders(): Promise<any> {
        this.logger.log('Manual cancellation triggered');
        return await this.handleExpiredOrders();
    }
}
