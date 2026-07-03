import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Order, ORDERSTATUS, PAYMENTSTATUS } from '@/models/order.model';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { User } from '@/models';

@Injectable()
export class OrderCancellationService {
    private readonly logger = new Logger(OrderCancellationService.name);

    constructor(
        @InjectModel(Order) private orderModel: typeof Order,
        @InjectModel(User) private userModel: typeof User,
        private readonly redisService: RedisService,
        private readonly mailService: MailService,
    ) { }

    /**
     * â­ Cron job cháº¡y má»—i 1 phÃºt Ä‘á»ƒ há»§y orders háº¿t háº¡n
     * Cron expression: '0 * * * * *' = má»—i phÃºt táº¡i giÃ¢y thá»© 0
     */
    @Cron('0 * * * * *') // Má»—i 1 phÃºt
    // @Cron('*/30 * * * * *') // Hoáº·c má»—i 30 giÃ¢y (test)
    async handleExpiredOrders() {
        const startTime = Date.now();
        this.logger.log('ðŸ”„ Starting expired orders cancellation job...');

        try {
            // â­ BÆ¯á»šC 1: Láº¥y danh sÃ¡ch orders háº¿t háº¡n tá»« Redis
            const expiredOrderNumbers = await this.redisService.getExpiredOrders();

            if (expiredOrderNumbers.length === 0) {
                this.logger.log('âœ… No expired orders found');
                return;
            }

            this.logger.log(`ðŸ“‹ Found ${expiredOrderNumbers.length} expired orders`);

            // â­ BÆ¯á»šC 2: Xá»­ lÃ½ tá»«ng order
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

                } catch (error: any) {
                    this.logger.error(`Failed to cancel order ${orderNumber}: ${error.message}`);
                    results.errors++
                }
            }

            // â­ BÆ¯á»šC 3: Log káº¿t quáº£
            const duration = Date.now() - startTime;
            this.logger.log(
                `âœ… Cancellation job completed in ${duration}ms | ` +
                `Cancelled: ${results.cancelled}, ` +
                `Already Paid: ${results.alreadyPaid}, ` +
                `Already Cancelled: ${results.alreadyCancelled}, ` +
                `Errors: ${results.errors}`
            );

        } catch (error: any) {
            this.logger.error(`Cancellation job failed: ${error.message}`)
        }
    }

    /**
     * â­ Há»§y má»™t order cá»¥ thá»ƒ
     */
    private async cancelExpiredOrder(
        orderNumber: string
    ): Promise<'cancelled' | 'already_paid' | 'already_cancelled' | 'error'> {

        this.logger.debug(`Processing order: ${orderNumber}`);

        // â­ BÆ¯á»šC 1: Acquire distributed lock
        const lockAcquired = await this.redisService.acquireLock(
            `cancel_${orderNumber}`,
            30 // 30 seconds TTL
        );

        if (!lockAcquired) {
            this.logger.warn(`Lock already held for ${orderNumber}, skipping...`);
            return 'error';
        }

        try {
            // â­ BÆ¯á»šC 2: Láº¥y order tá»« database
            const order = await this.orderModel.findOne({
                where: { orderNumber },
            });

            if (!order) {
                this.logger.warn(`Order ${orderNumber} not found in database`);
                await this.redisService.removePendingOrder(orderNumber);
                return 'error';
            }

            // â­ BÆ¯á»šC 3: Check payment status
            if (order.paymentStatus === PAYMENTSTATUS.PAID) {
                this.logger.log(`Order ${orderNumber} already paid, removing from Redis`);
                await this.redisService.removePendingOrder(orderNumber);
                return 'already_paid';
            }

            // â­ BÆ¯á»šC 4: Check order status
            if (order.orderStatus === ORDERSTATUS.CANCELLED) {
                this.logger.log(`Order ${orderNumber} already cancelled`);
                await this.redisService.removePendingOrder(orderNumber);
                return 'already_cancelled';
            }

            // â­ BÆ¯á»šC 5: Update order status to CANCELLED
            await order.update({
                orderStatus: ORDERSTATUS.CANCELLED,
                paymentStatus: PAYMENTSTATUS.FAILED,
                cancelledAt: new Date(),
                cancelReason: 'Payment timeout - Order expired after 20 minutes',
            } as Partial<Order>);

            this.logger.log(`âœ… Order ${orderNumber} cancelled successfully`);

            // â­ BÆ¯á»šC 6: Remove from Redis
            await this.redisService.removePendingOrder(orderNumber);
            this.logger.debug(`Removed ${orderNumber} from Redis pending list`);

            // â­ BÆ¯á»šC 7: Send notification (optional - implement later)
            await this.sendCancellationEmail(order);

            return 'cancelled';

        } catch (error: any) {
            this.logger.error(`Error cancelling order ${orderNumber}: ${error.message}`);
            return 'error';

        } finally {
            // â­ BÆ¯á»šC 8: Release lock
            await this.redisService.releaseLock(`cancel_${orderNumber}`);
        }
    }

    /**
     * â­ Gá»­i thÃ´ng bÃ¡o há»§y Ä‘Æ¡n (optional - implement later)
     */
    private async sendCancellationEmail(order: Order): Promise<void> {
        try {

            const userId = order.dataValues.userId;
            let user: any = null;
            if (userId !== null) {
                user = await this.userModel.findByPk(userId);
                // Rest of your code...
            }
            // Láº¥y user email
            const userEmail = user?.dataValues.email || '';
            const userName = user?.dataValues.name || '';

            if (!userEmail) {
                this.logger.warn(`No email found for order ${order.dataValues.orderNumber}`);
                return;
            }

            // Format giÃ¡ tiá»n
            const totalAmount = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(order.dataValues.finalTotal);

            const cancelledAt = order.dataValues.cancelledAt
                ? order.dataValues.cancelledAt.toISOString()
                : '';

            const cancelReason = order.dataValues.cancelledReason || 'Háº¿t háº¡n Ä‘Æ¡n hÃ ng';
            // Gá»­i email
            await this.mailService.sendOrderCancellationEmail(
                userEmail,
                userName,
                order.dataValues.orderNumber,
                totalAmount,
                order.dataValues.createdAt.toISOString(),
                cancelledAt,
                cancelReason,
            );

        } catch (error: any) {
            this.logger.error(`Error sending cancellation email: ${error.message}`);
            throw error;
        }
    }

    /**
     * â­ Manual trigger Ä‘á»ƒ test (optional)
     */
    async manualCancelExpiredOrders(): Promise<any> {
        this.logger.log('Manual cancellation triggered');
        return await this.handleExpiredOrders();
    }
}
