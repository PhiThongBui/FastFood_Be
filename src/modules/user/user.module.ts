import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@/models';
import { MailModule } from '../mail/mail.module';
import { RolesGuard } from '@/common/guards/role.guards';

@Module({
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  imports: [
    SequelizeModule.forFeature([User]),MailModule
  ],
  exports: [UserService]
})
export class UserModule { }
