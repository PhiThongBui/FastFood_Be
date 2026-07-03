import { log } from 'node:console';
import { Address } from '@/models';
import { HttpService } from '@nestjs/axios';
import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAddressDto, DistanceCalculationResultDto } from './dto/addressStore.dto';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

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
            longitude: this.configService.get('STORE_LONGITUDE') as number
        }
    }

    async caculateDistance(customerLatitude: number, customerLongitude: number): Promise<DistanceCalculationResultDto> {
        const origins = `${this.StoreLocation.latitude},${this.StoreLocation.longitude}`;
        const destinations = `${customerLatitude},${customerLongitude}`;

        const url = `https://rsapi.goong.io/DistanceMatrix?origins=${origins}&destinations=${destinations}&vehicle=car&api_key=${this.GOONG_API_KEY}`;

        try {
            const response = await firstValueFrom(this.httpService.get(url));
            console.log("Goong API Response:", JSON.stringify(response.data, null, 2));

            // kiá»ƒm tra rows cÃ³ tá»“n táº¡i khÃ´ng
            if (!response.data.rows || response.data.rows.length === 0) {
                throw new BadGatewayException('KhÃ´ng cÃ³ dá»¯ liá»‡u tuyáº¿n Ä‘Æ°á»ng tá»« Goong API');
            }

            // Kiá»ƒm tra elements
            const row = response.data.rows[0];
            if (!row.elements || row.elements.length === 0) {
                throw new BadGatewayException('KhÃ´ng tÃ¬m tháº¥y elements trong dá»¯ liá»‡u');
            }

            const element = row.elements[0];

            // Kiá»ƒm tra status cá»§a element
            if (element.status === 'OK') {
                return {
                    distance: element.distance.value / 1000, // km
                    duration: element.duration.value / 60,   // phÃºt
                    status: element.status
                };
            } else if (element.status === 'ZERO_RESULTS') {
                throw new BadGatewayException('KhÃ´ng tÃ¬m tháº¥y tuyáº¿n Ä‘Æ°á»ng giá»¯a cá»­a hÃ ng vÃ  Ä‘iá»ƒm giao hÃ ng');
            } else {
                throw new BadGatewayException(`Lá»—i tÃ­nh toÃ¡n khoáº£ng cÃ¡ch: ${element.status}`);
            }
            
        } catch (error: any) {
            console.error('Lá»—i tÃ­nh toÃ¡n khoáº£ng cÃ¡ch:', error);
            
            // Chá»‰ re-throw náº¿u Ä‘Ã£ lÃ  BadGatewayException
            if (error instanceof BadGatewayException) {
                throw error;
            }
            
            // Náº¿u lÃ  lá»—i khÃ¡c (network, timeout, etc.)
            throw new BadGatewayException(`KhÃ´ng thá»ƒ tÃ­nh toÃ¡n khoáº£ng cÃ¡ch: ${error.message}`);
        }
    }

    async createAddress(address: CreateAddressDto) {
        const transaction = await this.sequelize.transaction();
        try {
            const newAddress = await this.modelAddress.create(address as Address, { transaction });
            await transaction.commit();
            
            return {
                message: 'Táº¡o Ä‘á»‹a chá»‰ thÃ nh cÃ´ng',
                data: newAddress
            };
        } catch (error: any) {
            console.log(error);
            await transaction.rollback();
            throw new BadRequestException(error.message);
        }
    }

    async createUserAddress(userId: number, address: CreateAddressDto) {
        return this.createAddress({
            ...address,
            userId,
            sessionId: undefined
        });
    }

    async getUserAddresses(userId: number) {
        const addresses = await this.modelAddress.findAll({
            where: { userId },
            order: [
                ['isDefault', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        return {
            message: 'Láº¥y danh sÃ¡ch Ä‘á»‹a chá»‰ thÃ nh cÃ´ng',
            data: addresses
        };
    }
}
