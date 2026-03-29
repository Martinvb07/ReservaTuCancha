import { useQuery } from '@tanstack/react-query';
import { courtsApi } from '@/lib/api/courts.api';
import type { CourtFilters } from '@/types';

export function useCourts(filters: CourtFilters = {}) {
  return useQuery({
    queryKey: ['courts', filters],
    queryFn: () => courtsApi.getAll(filters),
    staleTime: 1000 * 60 * 3,
  });
}

export function useCourt(id: string) {
  return useQuery({
    queryKey: ['court', id],
    queryFn: () => courtsApi.getById(id),
    enabled: !!id,
  });
}

export function useMyCourts() {
  return useQuery({
    queryKey: ['my-courts'],
    queryFn: () => courtsApi.getMyCourts(),
  });
}
