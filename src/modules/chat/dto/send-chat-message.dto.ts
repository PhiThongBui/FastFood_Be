import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SendChatMessageDto {
    @ApiProperty({ example: 'Quán hôm nay còn combo gà rán không?' })
    @IsString()
    @MaxLength(5000)
    content: string;

    @ApiPropertyOptional({ example: 123 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    orderId?: number;
}
