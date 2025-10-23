import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { SepayWebhookService } from './sepay-webhook.service';

@Controller('payment/sepay')
export class SepayWebhookController {
    private readonly logger = new Logger(SepayWebhookController.name);

    constructor(
        private readonly sepayWebhookService: SepayWebhookService
    ) {}

    /**
     * ⭐ Webhook từ SePay khi có giao dịch mới
     */
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() webhookData: any) {
        this.logger.log(`Received Sepay webhook: ${JSON.stringify(webhookData)}`);

        try {
            await this.sepayWebhookService.processWebhook(webhookData);
            
            return {
                success: true,
                message: 'Webhook processed successfully'
            };

        } catch (error) {
            this.logger.error(`Webhook processing failed: ${error.message}`);
            
            return {
                success: false,
                message: error.message
            };
        }
    }
}
