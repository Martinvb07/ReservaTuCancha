import { IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReprogramarBookingDto {
  @ApiProperty({ example: '2026-09-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM)' })
  startTime: string;

  @ApiProperty({ example: '10:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM)' })
  endTime: string;
}
