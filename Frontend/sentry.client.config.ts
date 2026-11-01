/* Errores del navegador. Sin NEXT_PUBLIC_SENTRY_DSN no se envía nada. */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  /* Fallos de extensiones del navegador y cortes de red que no son nuestros. */
  ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured', 'Load failed'],
});
