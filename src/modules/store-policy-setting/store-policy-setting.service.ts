import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StorePolicySetting } from '@/models';
import { ORDERSTATUS, PAYMENTSTATUS } from '@/models/order.model';
import { Order } from '@/models/order.model';
import { UpdateStorePolicySettingDto } from './dto/update-store-policy-setting.dto';

const STORE_POLICY_SETTING_ID = 1;

@Injectable()
export class StorePolicySettingService {
    constructor(
        @InjectModel(StorePolicySetting) private readonly storePolicySettingModel: typeof StorePolicySetting,
    ) { }

    async getSetting() {
        const [setting] = await this.storePolicySettingModel.findOrCreate({
            where: { id: STORE_POLICY_SETTING_ID },
            defaults: {
                id: STORE_POLICY_SETTING_ID,
                allowUserCancel: true,
                cancelBeforeMinutes: null,
                allowCancelPaidOrder: false,
                storeName: 'Go Pizza',
                storeAddress: null,
                storePhone: null,
                storeEmail: null,
                openingHours: null,
                deliveryPolicy: null,
                cancellationPolicy: null,
                paymentPolicy: null,
                contactPolicy: null,
            } as any,
        });

        return setting;
    }

    async updateSetting(dto: UpdateStorePolicySettingDto) {
        const setting = await this.getSetting();
        const payload = this.normalizeUpdatePayload(dto);

        await setting.update(payload as any);

        return setting.reload();
    }

    async assertUserCanCancelOrder(order: Order) {
        const setting = await this.getSetting();

        if (!setting.allowUserCancel) {
            throw new BadRequestException('Restaurant policy does not allow customer cancellation');
        }

        if (order.orderStatus !== ORDERSTATUS.PENDING) {
            throw new BadRequestException('Only pending orders can be cancelled by customer');
        }

        if (!setting.allowCancelPaidOrder && order.paymentStatus === PAYMENTSTATUS.PAID) {
            throw new BadRequestException('Paid order cannot be cancelled by customer');
        }

        if (setting.cancelBeforeMinutes !== null && setting.cancelBeforeMinutes !== undefined) {
            const createdAt = new Date((order as any).createdAt);
            const deadline = createdAt.getTime() + Number(setting.cancelBeforeMinutes) * 60 * 1000;

            if (Date.now() > deadline) {
                throw new BadRequestException('Order cancellation time has expired');
            }
        }
    }

    private normalizeUpdatePayload(dto: UpdateStorePolicySettingDto) {
        const payload: Record<string, unknown> = {
            ...dto,
            storeName: this.normalizeText(dto.storeName),
            storeAddress: this.normalizeText(dto.storeAddress),
            storePhone: this.normalizeText(dto.storePhone),
            storeEmail: this.normalizeText(dto.storeEmail),
            openingHours: this.normalizeText(dto.openingHours),
            deliveryPolicy: this.normalizeText(dto.deliveryPolicy),
            cancellationPolicy: this.normalizeText(dto.cancellationPolicy),
            paymentPolicy: this.normalizeText(dto.paymentPolicy),
            contactPolicy: this.normalizeText(dto.contactPolicy),
        };

        if ('cancelBeforeMinutes' in dto) {
            payload.cancelBeforeMinutes =
                dto.cancelBeforeMinutes === null || dto.cancelBeforeMinutes === undefined
                    ? null
                    : Number(dto.cancelBeforeMinutes);
        }

        return this.removeUndefinedValues(payload);
    }

    private normalizeText(value?: string | null) {
        if (value === undefined) return undefined;
        const trimmed = value?.trim();

        return trimmed || null;
    }

    private removeUndefinedValues(payload: Record<string, unknown>) {
        return Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== undefined)
        );
    }
}
