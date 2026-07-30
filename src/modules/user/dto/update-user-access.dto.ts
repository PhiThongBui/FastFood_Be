import { PERMISSIONS, PermissionValue } from '@/common/constants/permissions.constant';
import { ENUMROLE } from '@/models/user.model';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsIn, IsOptional } from 'class-validator';

export class UpdateUserAccessDto {
  @ApiPropertyOptional({ enum: ENUMROLE })
  @IsOptional()
  @IsEnum(ENUMROLE)
  role?: ENUMROLE;

  @ApiPropertyOptional({ enum: Object.values(PERMISSIONS), isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(Object.values(PERMISSIONS), { each: true })
  permissions?: PermissionValue[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
