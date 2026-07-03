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
    ) { }

    async processWebhook(webhookData: any) {
        this.logger.debug(`[WEBHOOK DATA] ${JSON.stringify(webhookData)}`);

        const normalized = this.normalizeWebhookData(webhookData);
        const orderNumber = this.sepayService.parseTransferContent(normalized.content);

        if (!orderNumber) {
            this.logger.warn(`[INVALID CONTENT] Cannot parse: ${normalized.content}`);
            return;
        }

        this.logger.log(`[PROCESSING] Order: ${orderNumber}, Transaction: ${normalized.transactionId}`);

        const lockAcquired = await this.redisService.acquireLock(orderNumber, 60);

        if (!lockAcquired) {
            this.logger.log(`[LOCK FAILED] Order ${orderNumber} is being processed`);
            return;
        }

        try {
            const order = await this.orderModel.findOne({
                where: { orderNumber }
            });

            if (!order) {
                this.logger.error(`[ORDER NOT FOUND] ${orderNumber}`);
                return;
            }

            if (order.paymentStatus === PAYMENTSTATUS.PAID) {
                this.logger.log(`[ALREADY PAID] ${orderNumber}`);
                return;
            }

            if (!Number.isFinite(normalized.transferAmount) || normalized.transferAmount <= 0) {
                this.logger.error(`[INVALID AMOUNT] ${orderNumber} - Received: ${normalized.transferAmount}`);
                return;
            }

            if (normalized.transferAmount < Number(order.finalTotal)) {
                this.logger.error(
                    `[AMOUNT MISMATCH] ${orderNumber} - Expected: ${order.finalTotal}, Received: ${normalized.transferAmount}`
                );
                return;
            }

            this.logger.log(`[AMOUNT VERIFIED] ${orderNumber} - Amount: ${normalized.transferAmount}`);

            await order.update({
                paymentStatus: PAYMENTSTATUS.PAID,
                orderStatus: ORDERSTATUS.PREPARING,
                momoTransId: String(normalized.transactionId || orderNumber),
                paidAt: normalized.transactionDate ? new Date(normalized.transactionDate) : new Date()
            });

            this.logger.log(`[ORDER UPDATED] ${orderNumber} marked as PAID`);

            await this.redisService.removePendingOrder(orderNumber);
            this.logger.log(`[REDIS REMOVED] ${orderNumber}`);

            await this.redisService.publishNewOrder({
                orderId: order.dataValues.id,
                orderNumber: order.dataValues.orderNumber,
                finalTotal: order.dataValues.finalTotal,
                paidAt: order.dataValues.paidAt,
                userId: order.dataValues.userId,
                addressId: order.dataValues.addressId
            });

            this.logger.log(`[NOTIFICATION SENT] ${orderNumber}`);

        } catch (error: any) {
            this.logger.error(`[PROCESS ERROR] ${orderNumber}: ${error.message}`);
            throw error;
        } finally {
            await this.redisService.releaseLock(orderNumber);
            this.logger.log(`[LOCK RELEASED] ${orderNumber}`);
        }
    }

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

    private normalizeWebhookData(webhookData: any) {
        const content = [
            webhookData.content,
            webhookData.transaction_content,
            webhookData.description,
            webhookData.body,
            webhookData.code
        ].filter(Boolean).join(' ');

        return {
            transactionId: webhookData.id || webhookData.referenceCode || webhookData.reference_number,
            transactionDate:
                webhookData.transactionDate ||
                webhookData.transaction_date ||
                webhookData.created_at ||
                webhookData.date,
            transferAmount: Number(
                webhookData.transferAmount ??
                webhookData.amount_in ??
                webhookData.amount ??
                webhookData.value ??
                0
            ),
            content
        };
    }
}
