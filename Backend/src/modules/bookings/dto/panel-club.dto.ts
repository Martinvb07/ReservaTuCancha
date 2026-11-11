import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class NoShowDto {
  @ApiProperty({ description: 'true: el cliente no llegó a su turno' })
  @IsBoolean()
  noShow: boolean;
}

/** Al menos uno de los dos: celular o correo. */
export class BloquearClienteDto {
  @ApiProperty({ required: false, example: '3001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motivo?: string;
}
