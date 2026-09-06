import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsDateString,
  IsMongoId,
  IsOptional,
  IsInt,
  IsIn,
  Min,
  Max,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  @IsMongoId()
  courtId: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MaxLength(80)
  guestName: string;

  @ApiProperty({ example: 'juan@email.com' })
  @IsEmail()
  guestEmail: string;

  @ApiProperty({ example: '+573001234567' })
  @IsString()
  @MaxLength(20)
  guestPhone: string;

  @ApiProperty({ example: '2025-08-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM)' })
  startTime: string;

  @ApiProperty({ example: '10:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM)' })
  endTime: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  players?: number;

  @ApiProperty({ example: 'Venimos con camisetas azules', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  /**
   * Se ignora: el total lo calcula el servidor con el precio de la cancha por
   * la duracion del turno. Se sigue aceptando para no romper a los clientes
   * que ya lo mandan, pero el valor que llegue aca no se usa nunca.
   */
  @ApiProperty({ example: 80000, required: false, deprecated: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalPrice?: number;

  @ApiProperty({ example: 'wompi', required: false })
  @IsOptional()
  @IsIn(['wompi'])
  paymentMethod?: 'wompi';
}
