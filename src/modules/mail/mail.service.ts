import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    // ... existing methods

    /**
     * ⭐ Gửi email thông báo order bị hủy
     */
    async sendOrderCancellationEmail(
        userEmail: string,
        userName: string,
        orderNumber: string,
        totalAmount: string,
        createdAt: string,
        cancelledAt: string,
        cancelReason: string,
    ): Promise<void> {
        try {
            this.logger.log(`Sending order cancellation email to ${userEmail}`);

            const appName = this.configService.get('APP_NAME') || 'FastFood';
            const supportEmail = this.configService.get('SUPPORT_EMAIL') || 'support@fastfood.com';
            const supportPhone = this.configService.get('SUPPORT_PHONE') || '1900 1234';
            const companyAddress = this.configService.get('COMPANY_ADDRESS') || 'Da Nang, Vietnam';
            const shopLink = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

            await this.mailerService.sendMail({
                to: userEmail,
                subject: `Đơn Hàng ${orderNumber} Đã Bị Hủy - ${appName}`,
                template: 'order-cancelled',
                context: {
                    appName,
                    userName,
                    orderNumber,
                    totalAmount,
                    createdAt: this.formatDateTime(new Date(createdAt)),
                    cancelledAt: this.formatDateTime(new Date(cancelledAt)),
                    cancelReason,
                    supportEmail,
                    supportPhone,
                    companyAddress,
                    shopLink,
                    currentYear: new Date().getFullYear(),
                },
            });

            this.logger.log(`✅ Order cancellation email sent to ${userEmail}`);

        } catch (error) {
            this.logger.error(
                `❌ Failed to send order cancellation email: ${error.message}`
            );
            throw error;
        }
    }


    async sendVerificationEmail(email: string, name: string, otp: string) {
    const appName = this.configService.get('APP_NAME');
    const supportEmail = this.configService.get('SUPPORT_EMAIL');
    const companyAddress = this.configService.get('COMPANY_ADDRESS');
    const companyPhone = this.configService.get('COMPANY_PHONE');
    const currentYear = new Date().getFullYear();
    const expiryTime = 5; // 5 phút

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Xác thực tài khoản - ${appName}`,
        template: 'verifyRegistation',
        context: {
          appName,
          userName: name,
          userEmail: email,
          otp,
          expiryTime,
          supportEmail,
          companyAddress,
          companyPhone,
          currentYear,
        },
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

    /**
     * ⭐ Helper: Format datetime
     */
    private formatDateTime(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh',
        };
        return date.toLocaleString('vi-VN', options);
    }

    /**
     * ⭐ Format currency
     */
    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    }
}
