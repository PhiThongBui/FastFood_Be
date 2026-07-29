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
import { Sequelize } from 'sequelize-typescript';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lấy ConfigService từ AppModule ra để dùng chuẩn hơn
  const configService = app.get(ConfigService);
  const logger = new Logger(bootstrap.name);
  const sequelize = app.get(Sequelize);

  await ensureProductVariantDefaultEnumValues(sequelize, logger);
  await ensureOrderSnapshotColumns(sequelize, logger);
  await ensureUserCouponColumns(sequelize, logger);
  await ensureStorePolicySettingColumns(sequelize, logger);
  await ensureDineInSchema(sequelize, logger);

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
void bootstrap();

async function ensureProductVariantDefaultEnumValues(sequelize: Sequelize, logger: Logger) {
  const dialect = sequelize.getDialect();

  if (dialect !== 'postgres') {
    logger.warn(`Skipping product variant enum schema patch for dialect: ${dialect}`);
    return;
  }

  try {
    const [sizeEnumRows] = await sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_ProductVariants_size' LIMIT 1;
    `);
    const [typeEnumRows] = await sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_ProductVariants_type' LIMIT 1;
    `);

    if (Array.isArray(sizeEnumRows) && sizeEnumRows.length > 0) {
      await sequelize.query(`ALTER TYPE "enum_ProductVariants_size" ADD VALUE IF NOT EXISTS 'DEFAULT';`);
    }

    if (Array.isArray(typeEnumRows) && typeEnumRows.length > 0) {
      await sequelize.query(`ALTER TYPE "enum_ProductVariants_type" ADD VALUE IF NOT EXISTS 'DEFAULT';`);
    }

    logger.log('Product variant default enum values are ready.');
  } catch (error) {
    logger.error('Failed to ensure product variant default enum values.', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

async function ensureOrderSnapshotColumns(sequelize: Sequelize, logger: Logger) {
  const dialect = sequelize.getDialect();

  if (dialect !== 'postgres') {
    logger.warn(`Skipping order snapshot schema patch for dialect: ${dialect}`);
    return;
  }

  try {
    await sequelize.query(`
      ALTER TABLE IF EXISTS "OrderItemComboOptions"
        ADD COLUMN IF NOT EXISTS "originalProductNameSnapshot" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "originalVariantNameSnapshot" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "selectedProductNameSnapshot" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "selectedVariantNameSnapshot" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "originalVariantModifiedPriceSnapshot" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "selectedVariantModifiedPriceSnapshot" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "variantSurchargeSnapshot" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "ingredientSurchargeSnapshot" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "surchargeSnapshot" INTEGER NOT NULL DEFAULT 0;

      ALTER TABLE IF EXISTS "OrderItemIngredients"
        ADD COLUMN IF NOT EXISTS "ingredientNameSnapshot" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "priceSnapshot" INTEGER;

      ALTER TABLE IF EXISTS "OrderItemComboOptionIngredients"
        ADD COLUMN IF NOT EXISTS "ingredientNameSnapshot" VARCHAR(255) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "priceSnapshot" INTEGER NOT NULL DEFAULT 0;
    `);

    logger.log('Order snapshot schema columns are ready.');
  } catch (error) {
    logger.error('Failed to ensure order snapshot schema columns.', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

async function ensureUserCouponColumns(sequelize: Sequelize, logger: Logger) {
  const dialect = sequelize.getDialect();

  if (dialect !== 'postgres') {
    logger.warn(`Skipping user coupon schema patch for dialect: ${dialect}`);
    return;
  }

  try {
    await sequelize.query(`
      ALTER TABLE IF EXISTS "UserCoupons"
        ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMPTZ;

      UPDATE "UserCoupons"
      SET "claimedAt" = COALESCE("claimedAt", "createdAt");

      CREATE UNIQUE INDEX IF NOT EXISTS "user_coupons_user_id_coupon_id_unique"
      ON "UserCoupons" ("userId", "couponId");
    `);

    logger.log('User coupon schema columns are ready.');
  } catch (error) {
    logger.error('Failed to ensure user coupon schema columns.', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

async function ensureStorePolicySettingColumns(sequelize: Sequelize, logger: Logger) {
  const dialect = sequelize.getDialect();

  if (dialect !== 'postgres') {
    logger.warn(`Skipping store policy setting schema patch for dialect: ${dialect}`);
    return;
  }

  try {
    await sequelize.query(`
      ALTER TABLE IF EXISTS "store_policy_settings"
        ADD COLUMN IF NOT EXISTS "storeName" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "storeAddress" TEXT,
        ADD COLUMN IF NOT EXISTS "storePhone" VARCHAR(30),
        ADD COLUMN IF NOT EXISTS "storeEmail" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "openingHours" VARCHAR(255);
    `);

    logger.log('Store policy setting schema columns are ready.');
  } catch (error) {
    logger.error('Failed to ensure store policy setting schema columns.', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

async function ensureDineInSchema(sequelize: Sequelize, logger: Logger) {
  const dialect = sequelize.getDialect();

  if (dialect !== 'postgres') {
    logger.warn(`Skipping dine-in schema patch for dialect: ${dialect}`);
    return;
  }

  try {
    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
          ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'STAFF';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Orders_orderType') THEN
          ALTER TYPE "enum_Orders_orderType" ADD VALUE IF NOT EXISTS 'DELIVERY';
          ALTER TYPE "enum_Orders_orderType" ADD VALUE IF NOT EXISTS 'DINE_IN';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_DiningTables_status') THEN
          ALTER TYPE "enum_DiningTables_status" ADD VALUE IF NOT EXISTS 'AVAILABLE';
          ALTER TYPE "enum_DiningTables_status" ADD VALUE IF NOT EXISTS 'OCCUPIED';
          ALTER TYPE "enum_DiningTables_status" ADD VALUE IF NOT EXISTS 'DISABLED';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_TableSessions_status') THEN
          ALTER TYPE "enum_TableSessions_status" ADD VALUE IF NOT EXISTS 'OPEN';
          ALTER TYPE "enum_TableSessions_status" ADD VALUE IF NOT EXISTS 'PAID';
          ALTER TYPE "enum_TableSessions_status" ADD VALUE IF NOT EXISTS 'CANCELLED';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_KitchenTickets_source') THEN
          ALTER TYPE "enum_KitchenTickets_source" ADD VALUE IF NOT EXISTS 'QR';
          ALTER TYPE "enum_KitchenTickets_source" ADD VALUE IF NOT EXISTS 'STAFF';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_KitchenTickets_status') THEN
          ALTER TYPE "enum_KitchenTickets_status" ADD VALUE IF NOT EXISTS 'NEW';
          ALTER TYPE "enum_KitchenTickets_status" ADD VALUE IF NOT EXISTS 'PREPARING';
          ALTER TYPE "enum_KitchenTickets_status" ADD VALUE IF NOT EXISTS 'READY';
          ALTER TYPE "enum_KitchenTickets_status" ADD VALUE IF NOT EXISTS 'SERVED';
          ALTER TYPE "enum_KitchenTickets_status" ADD VALUE IF NOT EXISTS 'CANCELLED';
        END IF;
      END $$;

      ALTER TABLE IF EXISTS "Users"
        ADD COLUMN IF NOT EXISTS "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb;

      ALTER TABLE IF EXISTS "Orders"
        ADD COLUMN IF NOT EXISTS "orderType" "enum_Orders_orderType" NOT NULL DEFAULT 'DELIVERY',
        ADD COLUMN IF NOT EXISTS "tableSessionId" INTEGER;

      ALTER TABLE IF EXISTS "Orders"
        ALTER COLUMN "addressId" DROP NOT NULL,
        ALTER COLUMN "deliveryFee" SET DEFAULT 0;

      ALTER TABLE IF EXISTS "OrderItems"
        ADD COLUMN IF NOT EXISTS "kitchenTicketId" INTEGER;

      CREATE UNIQUE INDEX IF NOT EXISTS "dining_tables_qr_token_unique"
        ON "DiningTables" ("qrToken");
      CREATE UNIQUE INDEX IF NOT EXISTS "table_sessions_active_table_unique"
        ON "TableSessions" ("tableId")
        WHERE "status" = 'OPEN';
    `);

    logger.log('Dine-in schema columns are ready.');
  } catch (error) {
    logger.error('Failed to ensure dine-in schema columns.', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}
