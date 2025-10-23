import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '@/models';
import { RedisService } from '../redis/redis.service';
import { SepayService } from './sepay.service';
import {ORDERSTATUS,PAYMENTMETHOD,PAYMENTSTATUS } from '@/models/order.model'
@Injectable()
export class SepayWebhookService {
    private readonly logger = new Logger(SepayWebhookService.name);

    constructor(
        @InjectModel(Order) private orderModel: typeof Order,
        private readonly redisService: RedisService,
        private readonly sepayService: SepayService
    ) {}

    async processWebhook(webhookData: any) {
        const {
            id: transactionId,
            gateway,
            transaction_date,
            account_number,
            sub_account,
            amount_in,
            amount_out,
            accumulated,
            code,
            transaction_content,
            reference_number,
            body
        } = webhookData;

        // ⭐ BƯỚC 1: PARSE NỘI DUNG CHUYỂN KHOẢN
        const orderNumber = this.sepayService.parseTransferContent(transaction_content);

        if (!orderNumber) {
            this.logger.warn(`Invalid transfer content: ${transaction_content}`);
            return;
        }

        this.logger.log(`Processing transaction for order: ${orderNumber}`);

        // ⭐ BƯỚC 2: DISTRIBUTED LOCK (Chống duplicate webhook)
        const lockAcquired = await this.redisService.acquireLock(orderNumber);
        
        if (!lockAcquired) {
            this.logger.log(`Order ${orderNumber} is being processed by another instance`);
            return;
        }

        try {
            // ⭐ BƯỚC 3: TÌM ORDER
            const order = await this.orderModel.findOne({
                where: { orderNumber }
            });

            if (!order) {
                this.logger.error(`Order not found: ${orderNumber}`);
                return;
            }

            // ⭐ BƯỚC 4: KIỂM TRA STATUS
            if (order.paymentStatus === PAYMENTSTATUS.PAID) {
                this.logger.log(`Order ${orderNumber} already paid`);
                await this.redisService.releaseLock(orderNumber);
                return;
            }

            // ⭐ BƯỚC 5: KIỂM TRA SỐ TIỀN
            if (amount_in < order.finalTotal) {
                this.logger.error(
                    `Amount mismatch for order ${orderNumber}. Expected: ${order.finalTotal}, Received: ${amount_in}`
                );
                // Có thể gửi thông báo cho admin
                await this.redisService.releaseLock(orderNumber);
                return;
            }

            // ⭐ BƯỚC 6: CẬP NHẬT ORDER
            await order.update({
                paymentStatus: PAYMENTSTATUS.PAID,
                orderStatus: ORDERSTATUS.PREPARING,
                momoTransId: transactionId,  // Lưu transaction ID của Sepay
                paidAt: new Date(transaction_date)
            });

            this.logger.log(`Order ${orderNumber} marked as PAID`);

            // ⭐ BƯỚC 7: XÓA KHỎI REDIS PENDING LIST
            await this.redisService.removePendingOrder(orderNumber);

            // ⭐ BƯỚC 8: PUBLISH NOTIFICATION (Gửi cho bếp)
            await this.redisService.publishNewOrder({
                orderId: order.id,
                orderNumber: order.orderNumber,
                finalTotal: order.finalTotal,
                paidAt: order.paidAt
            });

            this.logger.log(`Published new order notification for ${orderNumber}`);

        } finally {
            // ⭐ BƯỚC 9: RELEASE LOCK
            await this.redisService.releaseLock(orderNumber);
        }
    }
}
