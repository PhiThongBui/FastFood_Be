import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';
import { RedisTestController } from './redis.controller';

@Global() // ⭐ Để sử dụng RedisService ở mọi nơi mà không cần import module
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService) => {
                return new Redis({
                    host: configService.get('REDIS_HOST') || 'localhost',
                    port: configService.get('REDIS_PORT') || 6379,
                    password: configService.get('REDIS_PASSWORD') || undefined,
                    retryStrategy: (times) => {
                        // Retry mỗi 3 giây, tối đa 5 phút
                        const delay = Math.min(times * 3000, 5 * 60 * 1000);
                        return delay;
                    },
                    maxRetriesPerRequest: 3,
                });
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    controllers: [RedisTestController],
    exports: [REDIS_CLIENT],
})
export class RedisModule {}
