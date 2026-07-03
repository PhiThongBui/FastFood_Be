import { Address } from '@/models';
import { HttpService } from '@nestjs/axios';
import {
    BadGatewayException,
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAddressDto, DistanceCalculationResultDto } from './dto/addressStore.dto';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';

@Injectable()
export class AddressService {
    private GOONG_API_KEY: string;
    private StoreLocation: { latitude: number; longitude: number };

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly sequelize: Sequelize,
        @InjectModel(Address) private readonly modelAddress: typeof Address,
    ) {
        this.GOONG_API_KEY = this.configService.get('GOONG_API_KEY') as string;
        this.StoreLocation = {
            latitude: this.configService.get('STORE_LATITUDE') as number,
            longitude: this.configService.get('STORE_LONGITUDE') as number,
        };
    }

    async caculateDistance(
        customerLatitude: number,
        customerLongitude: number
    ): Promise<DistanceCalculationResultDto> {
        const origins = `${this.StoreLocation.latitude},${this.StoreLocation.longitude}`;
        const destinations = `${customerLatitude},${customerLongitude}`;

        const url = `https://rsapi.goong.io/DistanceMatrix?origins=${origins}&destinations=${destinations}&vehicle=car&api_key=${this.GOONG_API_KEY}`;

        try {
            const response = await firstValueFrom(this.httpService.get(url));
            console.log('Goong API Response:', JSON.stringify(response.data, null, 2));

            if (!response.data.rows || response.data.rows.length === 0) {
                throw new BadGatewayException('Khong co du lieu tuyen duong tu Goong API');
            }

            const row = response.data.rows[0];
            if (!row.elements || row.elements.length === 0) {
                throw new BadGatewayException('Khong tim thay elements trong du lieu');
            }

            const element = row.elements[0];

            if (element.status === 'OK') {
                return {
                    distance: element.distance.value / 1000,
                    duration: element.duration.value / 60,
                    status: element.status,
                };
            }

            if (element.status === 'ZERO_RESULTS') {
                throw new BadGatewayException(
                    'Khong tim thay tuyen duong giua cua hang va diem giao hang'
                );
            }

            throw new BadGatewayException(`Loi tinh toan khoang cach: ${element.status}`);
        } catch (error: unknown) {
            console.error('Loi tinh toan khoang cach:', error);

            if (error instanceof BadGatewayException) {
                throw error;
            }

            if (error instanceof Error) {
                throw new BadGatewayException(
                    `Khong the tinh toan khoang cach: ${error.message}`
                );
            }

            throw new BadGatewayException('Khong the tinh toan khoang cach');
        }
    }

    async createAddress(address: CreateAddressDto) {
        const transaction = await this.sequelize.transaction();

        try {
            const payload = await this.prepareUserAddressPayload(address, transaction);
            const newAddress = await this.modelAddress.create(payload as Address, { transaction });
            await transaction.commit();

            return {
                message: 'Tao dia chi thanh cong',
                data: newAddress,
            };
        } catch (error: unknown) {
            await transaction.rollback();

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }

            throw new BadRequestException('Khong the tao dia chi');
        }
    }

    async createUserAddress(userId: number, address: CreateAddressDto) {
        return this.createAddress({
            ...address,
            userId,
            sessionId: undefined,
        });
    }

    async updateUserAddress(userId: number, addressId: number, address: CreateAddressDto) {
        const transaction = await this.sequelize.transaction();

        try {
            const existingAddress = await this.modelAddress.findOne({
                where: { id: addressId, userId },
                transaction,
            });

            if (!existingAddress) {
                throw new NotFoundException('Khong tim thay dia chi giao hang');
            }

            const payload = await this.prepareUserAddressPayload(
                {
                    ...address,
                    userId,
                    sessionId: undefined,
                },
                transaction,
                existingAddress.id
            );
            await this.modelAddress.update(
                {
                    ...payload,
                    userId,
                    sessionId: null,
                } as Partial<Address>,
                {
                    where: { id: addressId, userId },
                    transaction,
                    hooks: false,
                    validate: false,
                }
            );

            const updatedAddress = await this.modelAddress.findOne({
                where: { id: addressId, userId },
                transaction,
            });

            await transaction.commit();

            return {
                message: 'Cap nhat dia chi thanh cong',
                data: updatedAddress,
            };
        } catch (error: unknown) {
            await transaction.rollback();

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }

            throw new BadRequestException('Khong the cap nhat dia chi');
        }
    }

    async getUserAddresses(userId: number) {
        const addresses = await this.modelAddress.findAll({
            where: { userId },
            order: [
                ['isDefault', 'DESC'],
                ['createdAt', 'DESC'],
            ],
        });

        return {
            message: 'Lay danh sach dia chi thanh cong',
            data: addresses,
        };
    }

    private async prepareUserAddressPayload(
        address: CreateAddressDto,
        transaction: Transaction,
        excludeAddressId?: number
    ) {
        const payload: CreateAddressDto = {
            ...address,
        };

        if (!payload.userId) {
            return payload;
        }

        if (payload.isDefault) {
            await this.modelAddress.update(
                { isDefault: false },
                {
                    where: {
                        userId: payload.userId,
                        ...(excludeAddressId ? { id: { [Op.ne]: excludeAddressId } } : {}),
                    },
                    transaction,
                    hooks: false,
                    validate: false,
                }
            );

            return payload;
        }

        const defaultCount = await this.modelAddress.count({
            where: {
                userId: payload.userId,
                isDefault: true,
                ...(excludeAddressId ? { id: { [Op.ne]: excludeAddressId } } : {}),
            },
            transaction,
        });

        if (defaultCount === 0) {
            payload.isDefault = true;
        }

        return payload;
    }
}
