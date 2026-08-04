import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Permission, PermissionGroup } from '@/models';
import { PermissionService } from './permission.service';

@Module({
  imports: [SequelizeModule.forFeature([PermissionGroup, Permission])],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
