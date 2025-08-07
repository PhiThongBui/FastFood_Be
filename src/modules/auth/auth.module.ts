import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@/models';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports:[UserModule]
})
export class AuthModule {}
