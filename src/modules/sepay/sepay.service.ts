import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SepayPaymentRequest {
    orderNumber: string;
    amount: number;
    orderInfo: string;
}

export interface SepayPaymentResponse {
    qrCode: string;
    qrDataURL: string;
    bankAccount: string;
    bankName: string;
    accountName: string;
    transferContent: string;
    amount: number;
}

@Injectable()
export class SepayService {
    private readonly logger = new Logger(SepayService.name);
    private readonly accountNumber: string;
    private readonly accountName: string;
    private readonly bankCode: string;
    private readonly apiToken: string;
    private readonly apiAuthScheme: string;
    private readonly apiEndpoint = 'https://my.sepay.vn/api/v1';

    constructor(private configService: ConfigService) {
        this.accountNumber = this.configService.get('SEPAY_ACCOUNT_NUMBER') as string;
        this.accountName = this.configService.get('SEPAY_ACCOUNT_NAME') as string;
        this.bankCode = this.configService.get('SEPAY_BANK_CODE') as string;
        this.apiToken = String(this.configService.get('SEPAY_API_TOKEN') || '').trim();
        this.apiAuthScheme = String(this.configService.get('SEPAY_API_AUTH_SCHEME') || 'Bearer').trim();
    }

    async createPayment(request: SepayPaymentRequest): Promise<SepayPaymentResponse> {
        this.logger.log(`Creating payment for order: ${request.orderNumber}`);
        this.logger.log(`Amount: ${request.amount}`);
        this.logger.log(`Order Info: ${request.orderInfo}`);

        const transferContent = this.generateTransferContent(request.orderNumber);
        const bankId = this.getBankId(this.bankCode);

        this.logger.debug(`Transfer content: ${transferContent}`);
        this.logger.debug(`Bank ID: ${bankId}`);
        this.logger.debug(`Account: ${this.accountNumber}`);
        this.logger.debug(`Account Name: ${this.accountName}`);

        try {
            const qrUrl = `https://img.vietqr.io/image/${bankId}-${this.accountNumber}-compact.jpg`;
            const params = {
                amount: request.amount,
                addInfo: transferContent,
                accountName: this.accountName
            };
            const fullUrl = `${qrUrl}?${new URLSearchParams(params as any).toString()}`;

            this.logger.debug(`Full QR URL: ${fullUrl}`);
            this.logger.debug(`Params: ${JSON.stringify(params)}`);

            const qrResponse = await axios.get(qrUrl, {
                params,
                responseType: 'arraybuffer'
            });
            const qrBase64 = Buffer.from(qrResponse.data, 'binary').toString('base64');

            this.logger.log('QR Code generated successfully');

            return {
                qrCode: qrBase64,
                qrDataURL: `data:image/jpeg;base64,${qrBase64}`,
                bankAccount: this.accountNumber,
                bankName: this.getBankName(this.bankCode),
                accountName: this.accountName,
                transferContent,
                amount: request.amount
            };
        } catch (error: any) {
            this.logger.error(`QR generation failed: ${error.message}`);

            if (error.response) {
                this.logger.error(`Status: ${error.response.status}`);
                this.logger.error(`Data: ${JSON.stringify(error.response.data)}`);
            }

            throw error;
        }
    }

    verifyWebhook(data: any): boolean {
        const isValid = Boolean(data?.content || data?.transaction_content) &&
            Boolean(data?.transferAmount || data?.amount_in || data?.amount);

        if (!isValid) {
            this.logger.error('Invalid webhook data from Sepay');
        }

        return isValid;
    }

    parseTransferContent(content?: string): string | null {
        if (!content || typeof content !== 'string') {
            return null;
        }

        const match = content.match(/DH\s+(ORD\d+)/i);
        return match ? match[1] : null;
    }

    async checkTransaction(orderNumber: string): Promise<any> {
        const transferContent = this.generateTransferContent(orderNumber);

        try {
            const response = await axios.get(`${this.apiEndpoint}/transactions`, {
                headers: this.buildAuthHeaders(),
                params: {
                    limit: 50,
                    offset: 0
                }
            });
            const transactions = this.extractTransactions(response.data);
            const transaction = transactions.find((tx: any) =>
                this.getTransactionContent(tx).includes(transferContent)
            );

            return transaction || null;
        } catch (error: any) {
            this.logApiError('check transaction', error);
            return null;
        }
    }

    async getRecentTransactions(): Promise<any[]> {
        try {
            this.logger.debug(`Fetching transactions from: ${this.apiEndpoint}/transactions`);

            const response = await axios.get(`${this.apiEndpoint}/transactions`, {
                headers: this.buildAuthHeaders(),
                params: {
                    limit: 50,
                    offset: 0
                }
            });
            const transactions = this.extractTransactions(response.data);

            this.logger.debug(`Fetched ${transactions.length} transactions from SePay`);

            return transactions;
        } catch (error: any) {
            this.logApiError('fetch transactions', error);
            return [];
        }
    }

    private generateTransferContent(orderNumber: string): string {
        return `DH ${orderNumber}`;
    }

    private buildAuthHeaders() {
        if (!this.apiToken) {
            this.logger.error('SEPAY_API_TOKEN is not configured');
            return {};
        }

        const hasScheme = /\s/.test(this.apiToken);
        const authorization = hasScheme
            ? this.apiToken
            : `${this.apiAuthScheme} ${this.apiToken}`;

        return { Authorization: authorization };
    }

    private logApiError(action: string, error: any) {
        const status = error?.response?.status;
        const responseData = error?.response?.data;

        if (status === 401) {
            this.logger.error(
                `Failed to ${action}: SePay API returned 401. Check SEPAY_API_TOKEN, token permissions, and SEPAY_API_AUTH_SCHEME.`
            );
            return;
        }

        this.logger.error(`Failed to ${action}: ${error.message}`);

        if (status) {
            this.logger.error(`SePay API status: ${status}`);
        }

        if (responseData) {
            this.logger.error(`SePay API response: ${JSON.stringify(responseData)}`);
        }
    }

    private extractTransactions(data: any): any[] {
        if (Array.isArray(data?.transactions)) return data.transactions;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data)) return data;
        return [];
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

    private getBankId(bankCode: string): string {
        const bankMapping = {
            MB: '970422',
            VCB: '970436',
            TCB: '970407',
            ACB: '970416',
            VTB: '970415',
            BIDV: '970418',
            AGR: '970405',
            SCB: '970429',
            TPB: '970423',
            MSB: '970426',
        };

        return bankMapping[bankCode] || bankCode;
    }

    private getBankName(bankCode: string): string {
        const bankNames = {
            MB: 'MB Bank',
            VCB: 'Vietcombank',
            TCB: 'Techcombank',
            ACB: 'ACB',
            VTB: 'Vietinbank',
            BIDV: 'BIDV',
            AGR: 'Agribank',
            SCB: 'Sacombank',
            TPB: 'TPBank',
            MSB: 'MSB',
        };

        return bankNames[bankCode] || bankCode;
    }
}
