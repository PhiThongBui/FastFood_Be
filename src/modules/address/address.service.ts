import { Address } from '@/models';
import { HttpService } from '@nestjs/axios';
import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAddressDto, DistanceCalculationResultDto } from './dto/addressStore.dto';
import { firstValueFrom } from 'rxjs';
import e from 'express';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AddressService {
    private Google_API_KEY: string;
    private StoreLocation: { latitude: number; longitude: number };

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly sequelize: Sequelize,
        @InjectModel(Address) private readonly modelAddress: typeof Address, // ✅ sửa ở đây
    ) {
        this.Google_API_KEY = this.configService.get('GOOGLE_API_KEY') as string;
        this.StoreLocation = {
            latitude: this.configService.get('STORE_LATITUDE') as number,
            longitude: this.configService.get('STORE_LONGITUDE') as number
        }
    }

    async caculateDistance(customerLatitude: number, customerLongitude: number): Promise<DistanceCalculationResultDto> {

        const originStore = `${this.StoreLocation.latitude},${this.StoreLocation.longitude}`

        const destinationCustomer = `${customerLatitude},${customerLongitude}`


        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStore}&destinations=${destinationCustomer}&units=metric&key=${this.Google_API_KEY}`;

        try {
            const response = await firstValueFrom(this.httpService.get(url));

            const element = response.data.rows[0].elements[0];

            if (element.status === 'OK') {
                return {
                    distance: element.distance.value / 1000,
                    duration: element.duration.value / 60,
                    status: element.status
                }
            }

            throw new BadGatewayException('Không tìm thấy điểm giao hàng')
        } catch (error) {
            console.log(error);
            throw new Error(error)
        }
    }

    async createAddress(address: CreateAddressDto) {
        const transaction = await this.sequelize.transaction()
        try {
            const hasSessionId = !!address.sessionId;
            const hasUserId = !!address.userId;
            if (!hasSessionId && !hasUserId) {
                throw new BadRequestException('Must have either sessionId or userId!');
            }
            if (hasSessionId && hasUserId) {
                throw new BadRequestException('Cannot have both sessionId and userId');
            }
            if (address.userId && address.isDefault) {
                await this.modelAddress.update({ isDefault: false }, { where: { userId: address.userId, isDefault: true }, transaction })
            }

            const newAddress = await this.modelAddress.create(address as Address, { transaction })

            await transaction.commit()

            return {
                message: 'Tạo địa chỉ thành công',
                data: newAddress
            }
        } catch (error) {
            console.log(error);
            await transaction.rollback()
            throw new BadRequestException(error.message)
        }
    }

}
