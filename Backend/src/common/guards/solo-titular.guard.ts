import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Deja pasar solo al dueño del club, no a sus empleados.
 *
 * Va en lo que mueve plata o permisos: la cuenta de ePayco donde el club
 * recibe sus pagos, el equipo y borrar canchas. Se usa después de
 * JwtAuthGuard.
 */
@Injectable()
export class SoloTitularGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.esStaff) {
      throw new ForbiddenException('Solo el dueño del club puede hacer esto');
    }
    return true;
  }
}
