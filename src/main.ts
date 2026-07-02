import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionFilter } from './common/filter/all-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lấy ConfigService từ AppModule ra để dùng chuẩn hơn
  const configService = app.get(ConfigService);
  const logger = new Logger(bootstrap.name);

  // --- 1. QUAN TRỌNG: CẤU HÌNH CORS ---
  // Cho phép Frontend gọi vào Backend
  app.enableCors({
    origin: [
      'https://fast-food-fe-eosin.vercel.app',
      'http://localhost:3000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });


  app.use(cookieParser());
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('FastFood APIs')
    .setDescription('Xây dựng API cho website bán đồ ăn nhanh')
    .setVersion('1.0')
    .addTag('NestJS', 'FastFood')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập token vào đây (VD: Bearer eyJhbGci...)',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, documentFactory);

  // Lấy PORT từ biến môi trường (Koyeb sẽ set cái này là 8000)
  const port = configService.get<number>('PORT') || 3000;

  // --- 2. QUAN TRỌNG: THÊM '0.0.0.0' ---
  // Nếu không có '0.0.0.0', Koyeb sẽ báo lỗi Health Check Failed
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on port: ${port}`);
  logger.log(`Swagger documentation available at: http://localhost:5000/api/v1 or http://localhost:${port}/api/v1`);
}
bootstrap();
