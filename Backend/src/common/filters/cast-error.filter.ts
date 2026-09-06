import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';
import { Response } from 'express';

/**
 * Un id que no es un ObjectId valido es un 404, no un 500.
 *
 * Mongoose lanza CastError apenas intenta convertir la cadena, antes de tocar
 * la base. Sin este filtro cada `/courts/<cualquier cosa>` devolvia un 500 con
 * su traza: ensuciaba los logs, rompia el monitoreo y le confirmaba a quien
 * probara que ahi habia algo sin validar.
 */
@Catch(MongooseError.CastError)
export class CastErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(CastErrorFilter.name);

  catch(exception: MongooseError.CastError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest();

    this.logger.warn(`Id invalido en ${req?.method} ${req?.url}: ${exception.path}`);

    res.status(404).json({
      statusCode: 404,
      message: 'Recurso no encontrado',
      error: 'Not Found',
    });
  }
}
