import { Controller } from '@nestjs/common';
import { SepayService } from './sepay.service';

@Controller('sepay')
export class SepayController {
  constructor(private readonly sepayService: SepayService) {}
}
