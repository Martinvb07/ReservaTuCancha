import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api/bookings.api';
import type { CreateBookingPayload } from '@/types';
import { toast } from 'sonner';

export function useBookingSlots(courtId: string, date: string) {
  return useQuery({
    queryKey: ['slots', courtId, date],
    queryFn: () => bookingsApi.getSlots(courtId, date),
    enabled: !!courtId && !!date,
    staleTime: 1000 * 30, // 30 segundos — slots cambian frecuentemente
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingsApi.create(payload),
    onSuccess: () => {
      toast.success('¡Reserva creada! Revisa tu email para confirmar.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la reserva');
    },
  });
}

export function useCancelBooking() {
  return useMutation({
    mutationFn: (token: string) => bookingsApi.cancelByToken(token),
    onSuccess: () => {
      toast.success('Reserva cancelada exitosamente.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'No se pudo cancelar la reserva');
    },
  });
}

export function useOwnerBookings() {
  return useQuery({
    queryKey: ['owner-bookings'],
    queryFn: () => bookingsApi.getOwnerBookings(),
  });
}
