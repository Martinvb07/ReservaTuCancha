import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockSlotDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @ApiProperty({ example: '2026-04-15' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @ApiProperty({ example: '11:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;

  @ApiProperty({ example: 'Mantenimiento', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
