import { Controller, Post, Body } from '@nestjs/common';
import { ComboService } from './combo.service';
import { CreateComboDto } from './dto/create-combo.dto';

@Controller('combo')
export class ComboController {
  constructor(private readonly comboService: ComboService) {
  }

  @Post('/admin/create')
  async createCombo(@Body() data: CreateComboDto) {
    return await this.comboService.createCombo(data)
  }
}
