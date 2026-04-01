import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
});

// Manejo global de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔴 Unauthorized - token inválido o expirado');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
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
