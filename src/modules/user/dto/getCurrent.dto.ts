// user/dto/get-current.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ENUMROLE, AuthProvider } from '../../../models/user.model';

export class GetCurrentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: '0123456789', nullable: true })
  phone: string | null;

  @ApiProperty({ enum: ENUMROLE, example: ENUMROLE.User })
  role: ENUMROLE;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ enum: AuthProvider, example: AuthProvider.LOCAL, nullable: true })
  authProvider: AuthProvider | null;

  @ApiProperty({ example: '2025-11-08T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-08T00:00:00.000Z' })
  updatedAt: Date;
}
