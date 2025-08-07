import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionFilter } from './common/filter/all-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new Logger(bootstrap.name)

  app.setGlobalPrefix('api/v1')

  app.useGlobalFilters(new AllExceptionFilter())
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // xóa các fields dư trong payload,
    forbidNonWhitelisted: true, // báo lỗi ra postmman
    // transform: true , // chuyển đổi dữ liệu object thành instance của DTO
  }))
  app.useGlobalInterceptors(new TransformInterceptor());


  //Swagger

  const config = new DocumentBuilder()
    .setTitle('FastFood APIs')
    .setDescription('Xây dựng API cho website bán đồ ăn nhanh')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, documentFactory);

  logger.log(`📚 Swagger documentation available at: http://localhost:${process.env.PORT}/api/v1`);
  const configService = new ConfigService();
  await app.listen(configService.get('PORT') ?? 3000);
  console.log(`Application is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
