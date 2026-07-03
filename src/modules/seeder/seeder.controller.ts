
import { Controller, Post } from '@nestjs/common';
import { SeederService } from './seeder.service';

@Controller('seeder')
export class SeederController {
  constructor(
    private readonly seederService: SeederService,
  ) { }

  @Post('/run')
  async runAllSeeders() {
    try {
      await this.seederService.runAllSeeder();
      return { message: 'All seeders completed successfully' };
    } catch (error: any) {
      return { message: 'Seeder failed', error: error.message };
    }
  }
}
