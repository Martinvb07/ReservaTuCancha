import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AbrirCajaDto {
  @ApiProperty({ description: 'Efectivo con el que arranca la caja', example: 50000 })
  @IsInt() @Min(0) @Max(100_000_000)
  base: number;
}

export class MovimientoCajaDto {
  @ApiProperty({ enum: ['ingreso', 'gasto'] })
  @IsIn(['ingreso', 'gasto'])
  tipo: 'ingreso' | 'gasto';

  @ApiProperty({ example: 'Venta de hidratación' })
  @IsString() @MinLength(2) @MaxLength(120)
  concepto: string;

  @ApiProperty({ example: 12000 })
  @IsInt() @Min(1) @Max(100_000_000)
  valor: number;
}

export class CerrarCajaDto {
  @ApiProperty({ description: 'Efectivo contado en el cajón al cerrar' })
  @IsInt() @Min(0) @Max(1_000_000_000)
  efectivoContado: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(500)
  notas?: string;
}
