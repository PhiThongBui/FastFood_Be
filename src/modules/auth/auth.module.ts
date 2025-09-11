import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@/models';
import { UserModule } from '../user/user.module';
import { LocalStrategy } from './strategies/local.strategy';
import { LocalAuthGuard } from './guards/local.guard';
import { JWTGuard } from './guards/verifyjwt.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleAuthGuard } from './guards/google.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, LocalAuthGuard, JWTGuard, JwtStrategy, GoogleAuthGuard, GoogleStrategy],
  imports:[UserModule,MailerModule],
  exports:[JWTGuard]
})
export class AuthModule {}
