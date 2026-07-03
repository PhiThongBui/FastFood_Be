import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '@/models';
import { PAYMENTMETHOD, PAYMENTSTATUS } from '@/models/order.model';
import { SepayService } from './sepay.service';
import { SepayWebhookService } from './sepay-webhook.service';
import { Op } from 'sequelize';

@Injectable()
export class SepayPollingService {
    private readonly logger = new Logger(SepayPollingService.name);

    constructor(
        @InjectModel(Order) private orderModel: typeof Order,
        private readonly sepayService: SepayService,
        private readonly sepayWebhookService: SepayWebhookService
    ) { }

    @Cron('*/30 * * * * *')
    async checkPendingTransactions() {
        try {
            if (process.env.SEPAY_POLLING_ENABLED !== 'true') {
                return;
            }

            const lookbackMinutes = Number(process.env.SEPAY_PENDING_LOOKBACK_MINUTES) || 120;
            const pendingOrders = await this.orderModel.findAll({
                where: {
                    paymentStatus: PAYMENTSTATUS.PENDING,
                    paymentMethod: PAYMENTMETHOD.SEPAY,
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - lookbackMinutes * 60 * 1000)
                    }
                }
            });

            if (pendingOrders.length === 0) {
                return;
            }

            this.logger.log(`Checking ${pendingOrders.length} pending SePay orders...`);

            const transactions = await this.sepayService.getRecentTransactions();

            if (!transactions || transactions.length === 0) {
                this.logger.warn('No recent SePay transactions found');
                return;
            }

            for (const order of pendingOrders) {
                const transferContent = `DH ${order.dataValues.orderNumber}`;
                const matchedTransaction = transactions.find((tx) => {
                    const content = this.getTransactionContent(tx);
                    const amount = this.getTransactionAmount(tx);

                    return content.includes(transferContent) && amount >= Number(order.dataValues.finalTotal);
                });

                if (!matchedTransaction) {
                    this.logger.debug(`No SePay transaction matched order ${order.dataValues.orderNumber}`);
                    continue;
                }

                this.logger.log(`Found SePay transaction for order: ${order.dataValues.orderNumber}`);
                await this.sepayWebhookService.processWebhook(matchedTransaction);
            }

        } catch (error: any) {
            this.logger.error(`Polling error: ${error.message}`);
        }
    }

    private getTransactionContent(transaction: any): string {
        return [
            transaction?.transaction_content,
            transaction?.content,
            transaction?.description,
            transaction?.body,
            transaction?.code
        ].filter(Boolean).join(' ');
    }

    private getTransactionAmount(transaction: any): number {
        return Number(
            transaction?.amount_in ??
            transaction?.transferAmount ??
            transaction?.amount ??
            transaction?.value ??
            0
        );
    }
}
