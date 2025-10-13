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

import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { SeederModule } from './modules/seeder/seeder.module';
import { ProductModule } from './modules/product/product.module';
import { ProductVariantModule } from './modules/product-variant/product-variant.module';
import { ProductIngredientModule } from './modules/product-ingredient/product-ingredient.module';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { CartItemModule } from './modules/cart-item/cart-item.module';
import { CartModule } from './modules/cart/cart.module';
import { CartItemIngredientModule } from './modules/cart-item-ingredient/cart-item-ingredient.module';
import { AddressModule } from './modules/address/address.module';
import { OrderModule } from './modules/order/order.module';
import { OrderItemModule } from './modules/order-item/order-item.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Add this line
    }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
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

    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
               secure: configService.get<string>('MAIL_SECURE') === 'true', // ép kiểu boolean

          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          }
        },
        defaults: {
          from: `"${configService.get('MAIL_DEFAULT_NAME')}" <${configService.get('MAIL_DEFAULT_EMAIL')}>`,
        },
        template: {
          dir: join(process.cwd(), 'src/templates/email'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    SeederModule,
    ProductModule,
    ProductVariantModule,
    ProductIngredientModule,
    IngredientModule,
    CartItemModule,
    CartModule,
    CartItemIngredientModule,
    AddressModule,
    OrderModule,
    OrderItemModule,
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(StartTimingMiddleware).forRoutes('*');
  }
}
