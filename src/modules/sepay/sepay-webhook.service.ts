import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '@/models';
import { ORDERSTATUS, PAYMENTSTATUS } from '@/models/order.model';
import { RedisService } from '../redis/redis.service';
import { SepayService } from './sepay.service';

@Injectable()
export class SepayWebhookService {
    private readonly logger = new Logger(SepayWebhookService.name);

    constructor(
        @InjectModel(Order) private orderModel: typeof Order,
        private readonly redisService: RedisService,
        private readonly sepayService: SepayService
    ) {}

    async processWebhook(webhookData: any) {
        this.logger.debug(`[WEBHOOK DATA] ${JSON.stringify(webhookData)}`)

        // ⭐ FIX: Map field names từ SePay format
        const {
            id: transactionId,
            gateway,
            transactionDate,        // ← camelCase
            accountNumber,          // ← camelCase
            subAccount,
            transferAmount,         // ← Thay vì amount_in
            content,                // ← Thay vì transaction_content
            referenceCode,          // ← Thay vì reference_number
            description,
            code
        } = webhookData;

        // ⭐ PARSE NỘI DUNG
        const orderNumber = this.sepayService.parseTransferContent(content);

        if (!orderNumber) {
            this.logger.warn(`[INVALID CONTENT] Cannot parse: ${content}`);
            return;
        }

        this.logger.log(`[PROCESSING] Order: ${orderNumber}, Transaction: ${transactionId}`);

        // ⭐ DISTRIBUTED LOCK
        const lockAcquired = await this.redisService.acquireLock(orderNumber, 60);
        
        if (!lockAcquired) {
            this.logger.log(`[LOCK FAILED] Order ${orderNumber} is being processed`);
            return;
        }

        try {
            // ⭐ TÌM ORDER
            const order = await this.orderModel.findOne({
                where: { orderNumber }
            });

            if (!order) {
                this.logger.error(`[ORDER NOT FOUND] ${orderNumber}`);
                return;
            }

            // ⭐ CHECK STATUS
            if (order.paymentStatus === PAYMENTSTATUS.PAID) {
                this.logger.log(`[ALREADY PAID] ${orderNumber}`);
                return;
            }

            // ⭐ VERIFY AMOUNT
            if (transferAmount < order.finalTotal) {
                this.logger.error(
                    `[AMOUNT MISMATCH] ${orderNumber} - Expected: ${order.finalTotal}, Received: ${transferAmount}`
                );
                return;
            }

            this.logger.log(`[AMOUNT VERIFIED] ${orderNumber} - Amount: ${transferAmount}`);

            // ⭐ UPDATE ORDER
            await order.update({
                paymentStatus: PAYMENTSTATUS.PAID,
                orderStatus: ORDERSTATUS.PREPARING,
                momoTransId: transactionId.toString(),
                paidAt: new Date(transactionDate)
            });

            this.logger.log(`[ORDER UPDATED] ${orderNumber} marked as PAID`);

            // ⭐ XÓA KHỎI REDIS
            await this.redisService.removePendingOrder(orderNumber);
            this.logger.log(`[REDIS REMOVED] ${orderNumber}`);

            // ⭐ PUBLISH NOTIFICATION
            await this.redisService.publishNewOrder({
                orderId: order.id,
                orderNumber: order.orderNumber,
                finalTotal: order.finalTotal,
                paidAt: order.paidAt,
                userId: order.userId,
                addressId: order.addressId
            });

            this.logger.log(`[NOTIFICATION SENT] ${orderNumber}`);

        } catch (error) {
            this.logger.error(`[PROCESS ERROR] ${orderNumber}: ${error.message}`);
            throw error;
            
        } finally {
            await this.redisService.releaseLock(orderNumber);
            this.logger.log(`[LOCK RELEASED] ${orderNumber}`);
        }
    }

    /**
     * ⭐ Check trạng thái thanh toán
     */
    async checkOrderStatus(orderNumber: string) {
        const order = await this.orderModel.findOne({
            where: { orderNumber },
            attributes: ['id', 'orderNumber', 'orderStatus', 'paymentStatus', 'finalTotal', 'paidAt']
        });

        if (!order) {
            return {
                found: false,
                orderNumber
            };
        }

        return {
            found: true,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            isPaid: order.paymentStatus === PAYMENTSTATUS.PAID,
            paidAt: order.paidAt
        };
    }
}
