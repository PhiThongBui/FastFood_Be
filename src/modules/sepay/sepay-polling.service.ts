import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '@/models';
import { SepayService } from './sepay.service';
import {PAYMENTMETHOD,PAYMENTSTATUS } from '@/models/order.model'
import { SepayWebhookService } from './sepay-webhook.service';
import { Op } from 'sequelize';

@Injectable()
export class SepayPollingService {
    private readonly logger = new Logger(SepayPollingService.name);

    constructor(
        @InjectModel(Order) private orderModel: typeof Order,
        private readonly sepayService: SepayService,
        private readonly sepayWebhookService: SepayWebhookService
    ) {}

    /**
     * ⭐ Chạy mỗi 30 giây để check giao dịch mới
     */
    @Cron('*/30 * * * * *') // Mỗi 30 giây
    async checkPendingTransactions() {
        try {
            // Lấy tất cả orders đang chờ thanh toán (trong vòng 20 phút gần đây)
            const pendingOrders = await this.orderModel.findAll({
                where: {
                    paymentStatus: PAYMENTSTATUS.PENDING,
                    paymentMethod: PAYMENTMETHOD.SEPAY,
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 20 * 60 * 1000) // 20 phút
                    }
                }
            });

            if (pendingOrders.length === 0) {
                return;
            }

            this.logger.log(`🔍 Checking ${pendingOrders.length} pending orders...`);

            // Lấy danh sách giao dịch từ SePay
            const transactions = await this.sepayService.getRecentTransactions();

            if (!transactions || transactions.length === 0) {
                this.logger.warn('No recent transactions found');
                return;
            }

            // Match giao dịch với orders
            for (const order of pendingOrders) {
                const transferContent = `DH ${order.dataValues.orderNumber}`;
                
                const matchedTransaction = transactions.find(tx => 
                    tx.transaction_content && 
                    tx.transaction_content.includes(transferContent) &&
                    tx.amount_in >= order.finalTotal
                );

                if (matchedTransaction) {
                    this.logger.log(`✅ Found transaction for order: ${order.dataValues.orderNumber}`);
                    
                    // Giả lập webhook để xử lý
                    await this.sepayWebhookService.processWebhook({
                        id: matchedTransaction.id,
                        gateway: matchedTransaction.gateway,
                        transaction_date: matchedTransaction.transaction_date,
                        account_number: matchedTransaction.account_number,
                        sub_account: matchedTransaction.sub_account || '',
                        amount_in: matchedTransaction.amount_in,
                        amount_out: matchedTransaction.amount_out || 0,
                        accumulated: matchedTransaction.accumulated || 0,
                        code: matchedTransaction.code || '',
                        transaction_content: matchedTransaction.transaction_content,
                        reference_number: matchedTransaction.reference_number || '',
                        body: matchedTransaction.body || ''
                    });
                }
            }

        } catch (error) {
            this.logger.error(`❌ Polling error: ${error.message}`);
        }
    }
}
