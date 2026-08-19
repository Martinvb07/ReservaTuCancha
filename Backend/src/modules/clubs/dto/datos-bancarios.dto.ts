// src/modules/clubs/dto/datos-bancarios.dto.ts
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { METODOS_PAGO, TIPOS_LLAVE } from '../schemas/club.schema';

/* Cada método pide datos distintos, así que la validación es condicional:
   `@ValidateIf` deja el campo fuera del chequeo cuando no aplica. Antes el
   endpoint recibía el body sin DTO y aceptaba cualquier cosa, incluida una
   cuenta a medio llenar a la que después no se le podía girar. */
export class DatosBancariosDto {
  @ApiProperty({ enum: METODOS_PAGO })
  @IsIn(METODOS_PAGO as unknown as string[], { message: 'Elige por dónde quieres recibir tus pagos' })
  metodo: string;

  @ApiProperty({ example: 'Martín Velásquez' })
  @IsString()
  @MinLength(3, { message: 'Escribe el nombre completo del titular' })
  @MaxLength(120)
  titular: string;

  @ApiProperty({ example: '1.234.567.890' })
  @IsString()
  @MinLength(5, { message: 'La cédula o NIT parece incompleto' })
  @MaxLength(20)
  documento: string;

  // ── Solo cuenta bancaria ──────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Bancolombia' })
  @ValidateIf((o) => o.metodo === 'bancolombia')
  @IsString()
  @IsNotEmpty({ message: 'Falta el nombre del banco' })
  banco?: string;

  @ApiPropertyOptional({ enum: ['ahorros', 'corriente'] })
  @ValidateIf((o) => o.metodo === 'bancolombia')
  @IsIn(['ahorros', 'corriente'], { message: 'Elige si la cuenta es de ahorros o corriente' })
  tipoCuenta?: string;

  // ── Cuenta bancaria y billeteras (en billetera es el celular) ─────
  @ApiPropertyOptional({ example: '000-000000-00' })
  @ValidateIf((o) => o.metodo !== 'breb')
  @IsString()
  @IsNotEmpty({ message: 'Falta el número de cuenta o celular' })
  @MaxLength(40)
  numero?: string;

  // ── Solo Bre-B ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: '@martin' })
  @ValidateIf((o) => o.metodo === 'breb')
  @IsString()
  @IsNotEmpty({ message: 'Escribe tu llave Bre-B' })
  @MaxLength(80)
  llave?: string;

  @ApiPropertyOptional({ enum: TIPOS_LLAVE })
  @ValidateIf((o) => o.metodo === 'breb')
  @IsIn(TIPOS_LLAVE as unknown as string[], { message: 'Indica de qué tipo es tu llave' })
  tipoLlave?: string;
}
