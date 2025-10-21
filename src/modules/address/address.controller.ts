import { Body, Controller, Post } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/addressStore.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post('/create')
  async createAddress(@Body() address: CreateAddressDto) {    
     return await this.addressService.createAddress(address)
  }
}
