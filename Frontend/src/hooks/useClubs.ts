import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/axios';

export interface Club {
  _id: string;
  name: string;
  logo?: string;
  city?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  sports?: string[];
  totalCourts?: number;
}

export function useClubs(sport: string, city?: string) {
  return useQuery({
    queryKey: ['clubs', sport, city],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (sport && sport !== 'all') params.deporte = sport;
      if (city) params.ciudad = city;
      const { data } = await api.get<Club[]>('/clubs', { params });
      return data;
    },
    enabled: true,
  });
}