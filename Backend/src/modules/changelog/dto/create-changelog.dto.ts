// src/modules/changelog/dto/create-changelog.dto.ts
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Mismas claves que usa el formulario de admin y la página de novedades. */
export const CHANGELOG_TAGS = [
  'nueva_funcion',
  'mejora',
  'correccion',
  'importante',
  'mantenimiento',
] as const;

export const CHANGELOG_AUDIENCES = ['todos', 'pro', 'empresarial', 'basico'] as const;

/* El formulario manda "" cuando dejan la versión en blanco, y para
   class-validator "" no es lo mismo que ausente: sin esto, publicar sin
   versión fallaría contra el @Matches. */
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class CreateChangelogDto {
  @ApiProperty({ example: 'Mapas: ahora se ve dónde queda cada cancha' })
  @IsString()
  @MinLength(3, { message: 'El título es muy corto' })
  @MaxLength(140, { message: 'El título no puede pasar de 140 caracteres' })
  titulo: string;

  @ApiProperty({ example: 'Los jugadores ya pueden buscar canchas en un mapa...' })
  @IsString()
  @MinLength(10, { message: 'La descripción es muy corta' })
  @MaxLength(1200, { message: 'La descripción no puede pasar de 1200 caracteres' })
  descripcion: string;

  @ApiPropertyOptional({ example: '2.2.0' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @Matches(/^v?\s*\d{1,4}(\.\d{1,4}){0,2}$/, {
    message: 'La versión debe verse como 2.2.0 (también sirve 2.2)',
  })
  version?: string;

  @ApiProperty({ enum: CHANGELOG_TAGS })
  @IsIn(CHANGELOG_TAGS as unknown as string[], { message: 'Tipo de cambio no válido' })
  tag: string;

  @ApiPropertyOptional({ enum: CHANGELOG_AUDIENCES, default: 'todos' })
  @IsOptional()
  @IsIn(CHANGELOG_AUDIENCES as unknown as string[], { message: 'Destinatarios no válidos' })
  destinatarios?: string;
}
