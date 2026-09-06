import { PartialType } from '@nestjs/swagger';
import { CreateCourtDto } from './create-court.dto';

/**
 * Clase de verdad, no `Partial<CreateCourtDto>`.
 *
 * Los tipos mapeados de TypeScript se borran al compilar: el ValidationPipe
 * recibia `Object`, se saltaba la validacion entera —`whitelist` incluido— y
 * despues `Object.assign` escribia en la cancha cualquier campo del schema que
 * viniera en el body.
 */
export class UpdateCourtDto extends PartialType(CreateCourtDto) {}
