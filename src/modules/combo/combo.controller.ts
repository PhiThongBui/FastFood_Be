import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ComboService } from './combo.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GetAllComboQueryDto, GetAllComboResponseDto } from './dto/getalls.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { ComboDetailDto } from './dto/getById.dto';

@Controller('combo')
export class ComboController {
  constructor(private readonly comboService: ComboService) {
  }

  @Post('/admin/create')
  async createCombo(@Body() data: CreateComboDto) {
    return await this.comboService.createCombo(data)
  }

  @Get('/public/get-all-combo')
  @ApiOperation({ summary: 'Lấy danh sách tất cả combo' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách combo',
  })
  async getAllCombos(@Query() query: GetAllComboQueryDto) {
    return this.comboService.getAllCombos(query);
  }

  @Get('/public/get-by-id/:id')
  @ApiParam({ name: 'id', type: Number })
  // @Serialize(ComboDetailDto)
  async getComboById(@Param('id') id: number) {
    return this.comboService.getComboById(id);
  } 
}
