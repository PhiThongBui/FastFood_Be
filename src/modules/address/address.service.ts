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

            // kiểm tra rows có tồn tại không
            if (!response.data.rows || response.data.rows.length === 0) {
                throw new BadGatewayException('Không có dữ liệu tuyến đường từ Goong API');
            }

            // Kiểm tra elements
            const row = response.data.rows[0];
            if (!row.elements || row.elements.length === 0) {
                throw new BadGatewayException('Không tìm thấy elements trong dữ liệu');
            }

            const element = row.elements[0];

            // Kiểm tra status của element
            if (element.status === 'OK') {
                return {
                    distance: element.distance.value / 1000, // km
                    duration: element.duration.value / 60,   // phút
                    status: element.status
                };
            } else if (element.status === 'ZERO_RESULTS') {
                throw new BadGatewayException('Không tìm thấy tuyến đường giữa cửa hàng và điểm giao hàng');
            } else {
                throw new BadGatewayException(`Lỗi tính toán khoảng cách: ${element.status}`);
            }
            
        } catch (error) {
            console.error('Lỗi tính toán khoảng cách:', error);
            
            // Chỉ re-throw nếu đã là BadGatewayException
            if (error instanceof BadGatewayException) {
                throw error;
            }
            
            // Nếu là lỗi khác (network, timeout, etc.)
            throw new BadGatewayException(`Không thể tính toán khoảng cách: ${error.message}`);
        }
    }

    async createAddress(address: CreateAddressDto) {
        const transaction = await this.sequelize.transaction();
        try {
            const newAddress = await this.modelAddress.create(address as Address, { transaction });
            await transaction.commit();
            
            return {
                message: 'Tạo địa chỉ thành công',
                data: newAddress
            };
        } catch (error) {
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
            message: 'Lấy danh sách địa chỉ thành công',
            data: addresses
        };
    }
}
