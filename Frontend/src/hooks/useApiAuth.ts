import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api/axios';

/**
 * Hook que mantiene sincronizado el token de autorización de NextAuth con axios
 * Cada vez que la sesión cambia, actualiza el header de Authorization
 */
export function useApiAuth() {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.accessToken) {
      // Inyectar token en el header de axios
      api.defaults.headers.common['Authorization'] = `Bearer ${(session as any).accessToken}`;
      console.log('✅ Token inyectado en axios');
    } else {
      // Limpiar si no hay sesión
      delete api.defaults.headers.common['Authorization'];
      console.log('⚠️ Sin token en axios');
    }
  }, [session]);

  return session;
}
