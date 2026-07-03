import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@/models';
import { MailModule } from '../mail/mail.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    SequelizeModule.forFeature([User]),MailModule
  ],
  exports: [UserService]
})
export class UserModule { }
