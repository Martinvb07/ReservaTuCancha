import api from './axios';
import type { Court, CourtsResponse, CourtFilters } from '@/types';

export const courtsApi = {
  getAll: async (filters: CourtFilters = {}): Promise<CourtsResponse> => {
    const params = new URLSearchParams();
    if (filters.sport)    params.set('sport', filters.sport);
    if (filters.city)     params.set('city', filters.city);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.page)     params.set('page', String(filters.page));
    if (filters.limit)    params.set('limit', String(filters.limit ?? 12));

    const { data } = await api.get<CourtsResponse>(`/courts?${params}`);
    return data;
  },

  getById: async (id: string): Promise<Court> => {
    const { data } = await api.get<Court>(`/courts/${id}`);
    return data;
  },

  getMyCourts: async (): Promise<Court[]> => {
    const { data } = await api.get<Court[]>('/courts/owner/my-courts');
    return data;
  },

  create: async (payload: Partial<Court>): Promise<Court> => {
    const { data } = await api.post<Court>('/courts', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Court>): Promise<Court> => {
    const { data } = await api.patch<Court>(`/courts/${id}`, payload);
    return data;
  },
};
