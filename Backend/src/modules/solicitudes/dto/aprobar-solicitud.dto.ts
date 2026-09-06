import { IsEmail, IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AprobarSolicitudDto {
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(80)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsEmail()
  email?: string;

  /** Si no viene, el servicio genera una clave temporal con crypto. */
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MinLength(10) @MaxLength(128)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsMongoId()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(40)
  nit?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(120)
  businessName?: string;
}
