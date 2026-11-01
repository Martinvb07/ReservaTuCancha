'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/* Último recurso cuando falla el propio layout: reporta y ofrece reintentar. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0, background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8, color: '#111827' }}>Algo salió mal</h1>
          <p style={{ color: '#6b7280', marginBottom: 20 }}>Ya nos llegó el aviso. Intenta de nuevo en un momento.</p>
          <button
            onClick={reset}
            style={{ background: '#a3e635', color: '#111827', border: 0, borderRadius: 999, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
