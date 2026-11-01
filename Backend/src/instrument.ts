/**
 * Monitoreo de errores con Sentry. Tiene que cargarse antes que todo lo demás
 * (es el primer import de main.ts) para poder instrumentar Express y Mongoose.
 *
 * Sin SENTRY_DSN no se envía nada: en local y en las pruebas queda apagado.
 */
import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/nestjs';

/* ConfigModule lee el .env recién al armar la app; Sentry lo necesita antes. */
dotenv.config();

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  /* Los datos de los jugadores (correo, teléfono, tokens) no salen hacia
     Sentry: se quitan el cuerpo, las cookies y la autorización. */
  beforeSend(evento) {
    if (evento.request) {
      delete evento.request.cookies;
      delete evento.request.data;
      if (evento.request.headers) delete evento.request.headers.authorization;
    }
    return evento;
  },
});
