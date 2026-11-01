import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsMongoId, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class ListaEsperaDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsMongoId()
  courtId: string;

  @ApiProperty({ example: '2026-11-15' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha inválida (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ example: '19:00' })
  @Matches(HORA, { message: 'Formato de hora inválido (HH:MM)' })
  startTime: string;

  @ApiProperty({ example: '20:00' })
  @Matches(HORA, { message: 'Formato de hora inválido (HH:MM)' })
  endTime: string;

  @ApiProperty({ example: 'juan@email.com' })
  @IsEmail()
  @MaxLength(120)
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @ApiProperty({ required: false, description: 'Token push del teléfono (app móvil)' })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  pushToken?: string;
}
