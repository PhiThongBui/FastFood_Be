import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@/models';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    SequelizeModule.forFeature([User]),
    JwtModule.registerAsync({
      inject:[ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SCRECT'),
        signOptions: {
          expiresIn: '7d'
        }
      }),
    })
  ],
  exports: [UserService]
})
export class UserModule { }
