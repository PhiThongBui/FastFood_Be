import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SepayPaymentRequest {
    orderNumber: string;
    amount: number;
    orderInfo: string;
}

export interface SepayPaymentResponse {
    qrCode: string;  // Base64 QR Code image
    qrDataURL: string;  // Data URL để hiển thị trực tiếp
    bankAccount: string;
    bankName: string;
    accountName: string;
    transferContent: string;  // Nội dung chuyển khoản (duy nhất)
    amount: number;
}

@Injectable()
export class SepayService {
    private readonly logger = new Logger(SepayService.name);
    private readonly accountNumber: string;
    private readonly accountName: string;
    private readonly bankCode: string;
    private readonly apiToken: string;
    private readonly apiEndpoint: string;

    constructor(private configService: ConfigService) {
        this.accountNumber = this.configService.get('SEPAY_ACCOUNT_NUMBER') as any;
        this.accountName = this.configService.get('SEPAY_ACCOUNT_NAME') as any;
        this.bankCode = this.configService.get('SEPAY_BANK_CODE') as any;
        this.apiToken = this.configService.get('SEPAY_API_TOKEN') as any;
        this.apiEndpoint = 'https://my.sepay.vn/userapi';
    }

    /**
     * ⭐ Tạo QR Code thanh toán
     */
   async createPayment(request: SepayPaymentRequest): Promise<SepayPaymentResponse> {
    const transferContent = this.generateTransferContent(request.orderNumber);

    this.logger.log(`Creating Sepay QR for order: ${request.orderNumber}`);
    this.logger.debug(`Transfer content: ${transferContent}`);
    this.logger.debug(`Bank code: ${this.bankCode}, Account: ${this.accountNumber}`);

    try {
        const bankId = this.getBankId(this.bankCode);
        
        // ⭐ FIX: Sử dụng URL format đúng của VietQR
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${this.accountNumber}-compact.jpg`;
        
        this.logger.debug(`QR URL: ${qrUrl}`);

        const qrResponse = await axios.get(qrUrl, {
            params: {
                amount: request.amount,
                addInfo: transferContent,
                accountName: this.accountName
            },
            responseType: 'arraybuffer'  // ⭐ Nhận binary data
        });

        // Convert binary to base64
        const qrBase64 = Buffer.from(qrResponse.data, 'binary').toString('base64');

        this.logger.log(`QR Code generated successfully for order: ${request.orderNumber}`);

        return {
            qrCode: qrBase64,
            qrDataURL: `data:image/jpeg;base64,${qrBase64}`,  // ⭐ JPEG không phải PNG
            bankAccount: this.accountNumber,
            bankName: this.getBankName(this.bankCode),
            accountName: this.accountName,
            transferContent: transferContent,
            amount: request.amount
        };

    } catch (error) {
        this.logger.error(`Sepay QR generation failed: ${error.message}`)
        
        // Log chi tiết để debug
        if (error.response) {
            this.logger.error(`Response status: ${error.response.status}`);
            this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
        
        throw error;
    }
}

    /**
     * ⭐ Sinh nội dung chuyển khoản duy nhất
     * Format: DH <orderNumber>
     * VD: DH ORD1729528900
     */
    private generateTransferContent(orderNumber: string): string {
        return `DH ${orderNumber}`;
    }

    /**
     * ⭐ Verify webhook từ SePay
     */
    verifyWebhook(data: any): boolean {
        // SePay webhook không có signature, cần check:
        // 1. Nội dung chuyển khoản khớp với orderNumber
        // 2. Số tiền khớp
        // 3. Token hợp lệ (nếu có)
        
        const isValid = data.content && data.amount;
        
        if (!isValid) {
            this.logger.error('Invalid webhook data from Sepay');
        }
        
        return isValid;
    }

    /**
     * ⭐ Parse nội dung chuyển khoản để lấy orderNumber
     */
    parseTransferContent(content: string): string | null {
        // Format: "DH ORD1729528900" hoặc "DH ORD1729528900 abc xyz"
        const match = content.match(/DH\s+(ORD\d+)/i);
        return match ? match[1] : null;
    }

    /**
     * Mapping Bank Code → Bank ID (VietQR)
     */
    private getBankId(bankCode: string): string {
        const bankMapping = {
            'MB': '970422',      // MB Bank
            'VCB': '970436',     // Vietcombank
            'TCB': '970407',     // Techcombank
            'ACB': '970416',     // ACB
            'VTB': '970415',     // Vietinbank
            'BIDV': '970418',    // BIDV
            'AGR': '970405',     // Agribank
            'SCB': '970429',     // Sacombank
            'TPB': '970423',     // TPBank
            'MSB': '970426',     // MSB
        };
        return bankMapping[bankCode] || bankCode;
    }

    /**
     * Mapping Bank Code → Bank Name
     */
    private getBankName(bankCode: string): string {
        const bankNames = {
            'MB': 'MB Bank',
            'VCB': 'Vietcombank',
            'TCB': 'Techcombank',
            'ACB': 'ACB',
            'VTB': 'Vietinbank',
            'BIDV': 'BIDV',
            'AGR': 'Agribank',
            'SCB': 'Sacombank',
            'TPB': 'TPBank',
            'MSB': 'MSB',
        };
        return bankNames[bankCode] || bankCode;
    }

    /**
     * ⭐ Kiểm tra trạng thái giao dịch qua API
     */
    async checkTransaction(orderNumber: string): Promise<any> {
        const transferContent = this.generateTransferContent(orderNumber);

        try {
            const response = await axios.get(`${this.apiEndpoint}/transactions`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                },
                params: {
                    limit: 50,
                    offset: 0
                }
            });

            // Tìm giao dịch khớp với nội dung chuyển khoản
            const transaction = response.data.transactions.find(
                (tx: any) => tx.transaction_content.includes(transferContent)
            );

            return transaction || null;

        } catch (error) {
            this.logger.error(`Failed to check transaction: ${error.message}`);
            return null;
        }
    }
}
