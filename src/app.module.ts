import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';
import { sequelizeConfig } from './config/sequelize.config';
import { CategoryModule } from './modules/category/category.module';
import { StartTimingMiddleware } from './common/middlewares/start-timing.middleware';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { SeederModule } from './modules/seeder/seeder.module';
import { ProductModule } from './modules/product/product.module';
import { ProductVariantModule } from './modules/product-variant/product-variant.module';
import { ProductIngredientModule } from './modules/product-ingredient/product-ingredient.module';
import { IngredientModule } from './modules/ingredient/ingredient.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Add this line
    }),

    SequelizeModule.forRootAsync({
      inject: [ConfigService,],
      useFactory: (config: ConfigService) => sequelizeConfig(config),
    }),
    CategoryModule,
    UserModule,
    AuthModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SCRECT'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRESIN') as number
        }
      }),
      global: true
    }),
    SeederModule,
    ProductModule,
    ProductVariantModule,
    ProductIngredientModule,
    IngredientModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(StartTimingMiddleware).forRoutes('*');
  }
}
