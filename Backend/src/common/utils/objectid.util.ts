import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Convierte a ObjectId lo que llego por la URL o el query.
 *
 * `new Types.ObjectId('lo que sea')` lanza un BSONError, que no es el CastError
 * que atrapa el filtro global: sale como un 500 con su traza. Aca se decide
 * antes y se responde 404, que es lo que un id inexistente merece.
 */
export function aObjectId(id: string, mensaje = 'Recurso no encontrado'): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException(mensaje);
  }
  return new Types.ObjectId(id);
}
