import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail, IsIn, IsInt, IsMongoId, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Una reserva que el club anota a mano: por teléfono o en el mostrador. */
export class ReservaManualDto {
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

  @ApiProperty({ example: 'Equipo de los martes' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  guestName: string;

  @ApiProperty({ required: false, example: '3001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  guestPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  /** Turno fijo: se anota el mismo horario durante varias semanas. */
  @ApiProperty({ required: false, minimum: 1, maximum: 26 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(26)
  semanas?: number;

  /**
   * Lo que el club le cobra en el club. Si no viene, el precio de lista. No
   * pasa por la plataforma: solo sirve para las estadísticas del club.
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  precio?: number;

  /** Cómo pagó en el club. Sale en la caja del día. */
  @ApiProperty({ required: false, enum: ['efectivo', 'transferencia', 'tarjeta'] })
  @IsOptional()
  @IsIn(['efectivo', 'transferencia', 'tarjeta'])
  medioPago?: 'efectivo' | 'transferencia' | 'tarjeta';
}
