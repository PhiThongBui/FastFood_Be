import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrderCancellationService } from './order-cancellation.service';
import { Order, User } from '@/models';
import { RedisModule } from '../redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        ScheduleModule.forRoot(), // ⭐ Enable cron jobs
        SequelizeModule.forFeature([Order,User]),
        RedisModule,
        MailModule,
        UserModule
    ],
    providers: [OrderCancellationService],
    exports: [OrderCancellationService],
})
export class CronModule {}
