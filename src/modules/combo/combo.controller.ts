import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ComboService } from './combo.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllComboQueryDto, GetAllComboResponseDto } from './dto/getalls.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';

@Controller('combo')
export class ComboController {
  constructor(private readonly comboService: ComboService) {
  }

  @Post('/admin/create')
  async createCombo(@Body() data: CreateComboDto) {
    return await this.comboService.createCombo(data)
  }

  @Get('/public/get-all')
  @ApiOperation({ summary: 'Lấy danh sách tất cả combo' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách combo',
    type: GetAllComboResponseDto
  })
  async getAllCombos(@Query() query: GetAllComboQueryDto) {
    return this.comboService.getAllCombos(query);
  }
}
