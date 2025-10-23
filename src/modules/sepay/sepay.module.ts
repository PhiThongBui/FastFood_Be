import { Module } from '@nestjs/common';
import { SepayService } from './sepay.service';
import { SepayController } from './sepay.controller';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayWebhookService } from './sepay-webhook.service';
import { RedisModule } from '../redis/redis.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Order } from '@/models';

@Module({
  controllers: [SepayController,SepayWebhookController],
  providers: [SepayService,SepayWebhookService],
  exports: [SepayService],
  imports: [SequelizeModule.forFeature([Order]) ,RedisModule],
})
export class SepayModule {}
