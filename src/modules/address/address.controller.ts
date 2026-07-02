import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/addressStore.dto';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { Request } from 'express';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post('/create')
  async createAddress(@Body() address: CreateAddressDto) {    
     return await this.addressService.createAddress(address)
  }

  @UseGuards(JWTGuard)
  @Post('/me')
  async createMyAddress(@Req() req: Request, @Body() address: CreateAddressDto) {
    const userId = (req.user as { uid: number; role: string }).uid;
    return this.addressService.createUserAddress(userId, address);
  }

  @UseGuards(JWTGuard)
  @Get('/me')
  async getMyAddresses(@Req() req: Request) {
    const userId = (req.user as { uid: number; role: string }).uid;
    return this.addressService.getUserAddresses(userId);
  }
}
