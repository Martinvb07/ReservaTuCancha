import axios from 'axios';
import { signOut, getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(token: string) {
  refreshQueue.forEach(cb => cb(token));
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const hadToken = !!originalRequest?.headers?.['Authorization'];

      if (hadToken && typeof window !== 'undefined') {
        // Intentar refresh de sesión via NextAuth (que internamente usa el refreshToken)
        if (!isRefreshing) {
          isRefreshing = true;
          originalRequest._retry = true;

          try {
            // Forzar a NextAuth a refrescar el token via el jwt callback
            const session = await getSession();
            const newToken = (session as any)?.accessToken;

            if (newToken && newToken !== originalRequest.headers['Authorization']?.replace('Bearer ', '')) {
              api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              processQueue(newToken);
              isRefreshing = false;

              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch {
            // refresh failed
          }

          isRefreshing = false;
          // Si llegamos aquí, el refresh falló — cerrar sesión
          signOut({ callbackUrl: '/auth/login' });
        } else {
          // Otra request está haciendo refresh, esperar
          return new Promise((resolve) => {
            refreshQueue.push((token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Error de conexión con el servidor';

    return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
  },
);

export default api;
