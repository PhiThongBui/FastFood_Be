import { ENUMROLE } from '@/models/user.model';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserAccessDto {
  @ApiPropertyOptional({ enum: ENUMROLE })
  @IsOptional()
  @IsEnum(ENUMROLE)
  role?: ENUMROLE;

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
