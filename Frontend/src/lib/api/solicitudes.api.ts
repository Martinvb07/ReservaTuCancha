import api from './axios';

export const solicitudesApi = {
  create: (data: any) => api.post('/solicitudes', data),
  list: () => api.get('/solicitudes'),
};
