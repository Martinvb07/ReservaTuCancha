import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Limita los intentos de login por cuenta, no por IP.
 *
 * El login del navegador entra por el proxy de Next (`/api/backend-login`),
 * asi que para el backend todos los intentos vienen de 127.0.0.1 salvo que el
 * proxy reenvie el IP real. Contar por correo protege la cuenta aunque el
 * atacante rote de IP, y de paso no deja a media ciudad afuera cuando comparten
 * una salida NAT.
 *
 * El guard global sigue contando por IP en paralelo: son dos rejas distintas.
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = typeof req?.body?.email === 'string'
      ? req.body.email.toLowerCase().trim()
      : '';
    return email ? `login:${email}` : `login-ip:${req?.ip ?? 'desconocido'}`;
  }
}
