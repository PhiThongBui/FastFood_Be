import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/addressStore.dto';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { Request } from 'express';

type RequestUser = {
  uid?: number | string;
  id?: number | string;
  role?: string;
};

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
    const userId = this.extractUserId(req);
    return this.addressService.createUserAddress(userId, address);
  }

  @UseGuards(JWTGuard)
  @Get('/me')
  async getMyAddresses(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.addressService.getUserAddresses(userId);
  }

  @UseGuards(JWTGuard)
  @Put('/me/:id')
  async updateMyAddress(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() address: CreateAddressDto
  ) {
    const userId = this.extractUserId(req);
    return this.addressService.updateUserAddress(userId, id, address);
  }

  private extractUserId(req: Request) {
    const user = req.user as RequestUser | undefined;
    const rawUserId = user?.uid ?? user?.id;
    const userId = Number(rawUserId);

    if (!rawUserId || Number.isNaN(userId) || userId <= 0) {
      throw new UnauthorizedException('Khong xac dinh duoc nguoi dung tu access token');
    }

    return userId;
  }
}
