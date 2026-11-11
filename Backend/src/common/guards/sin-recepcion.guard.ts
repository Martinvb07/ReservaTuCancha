import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Cierra el paso al empleado con rol "recepción".
 *
 * Recepción atiende el día a día: ve y anota reservas, bloquea horarios y
 * marca quién no llegó. No ve las estadísticas ni la plata del club, y no
 * edita canchas, fotos ni el perfil. El "encargado" y el dueño sí pasan.
 * Se usa después de JwtAuthGuard.
 */
@Injectable()
export class SinRecepcionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.esStaff && user?.rolEquipo === 'recepcion') {
      throw new ForbiddenException('Tu acceso es de recepción: esto lo hace el dueño o un encargado');
    }
    return true;
  }
}
