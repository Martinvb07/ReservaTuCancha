import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import api from '@/lib/api/axios';

/**
 * Hook que mantiene sincronizado el token de autorización de NextAuth con axios.
 * Si el refresh token falla, cierra sesión automáticamente.
 */
export function useApiAuth() {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${(session as any).accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }

    // Si NextAuth reporta error de refresh, cerrar sesión
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/auth/login' });
    }
  }, [session]);

  return session;
}
