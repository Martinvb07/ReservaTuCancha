import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const URL_WEB = { protocols: ['http', 'https'], require_protocol: true };

/** Cada red es opcional; vacío la quita. */
class SocialLinksDto {
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(URL_WEB) @MaxLength(300)
  instagram?: string;

  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(URL_WEB) @MaxLength(300)
  facebook?: string;

  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(URL_WEB) @MaxLength(300)
  tiktok?: string;

  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(URL_WEB) @MaxLength(300)
  whatsapp?: string;
}

export class UpdateClubProfileDto {
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(80)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(20)
  contactPhone?: string;

  @ApiProperty({ required: false })
  /* Vacío quita el correo. */
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsEmail()
  contactEmail?: string;

  @ApiProperty({ required: false })
  /* Vacío quita el logo. */
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(URL_WEB) @MaxLength(500)
  logo?: string;

  /* Estos tres faltaban acá: el panel los mandaba y, como la validación
     rechaza campos desconocidos, el perfil entero no se guardaba. */
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(120)
  slogan?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(120)
  schedule?: string;

  @ApiProperty({ required: false, type: SocialLinksDto })
  @IsOptional() @ValidateNested() @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  /** Foto grande de arriba de la página pública. Vacío la quita. */
  @ApiProperty({ required: false })
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl(URL_WEB) @MaxLength(500)
  coverPhoto?: string;

  /** Aviso corto que sale destacado en la página: una promo, un torneo. */
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(140)
  anuncio?: string;
}
