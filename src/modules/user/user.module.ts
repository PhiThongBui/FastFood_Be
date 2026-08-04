import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@/models';
import { MailModule } from '../mail/mail.module';
import { RolesGuard } from '@/common/guards/role.guards';
import { PermissionModule } from '../permission/permission.module';

@Module({
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  imports: [SequelizeModule.forFeature([User]), MailModule, PermissionModule],
  exports: [UserService],
})
export class UserModule {}
