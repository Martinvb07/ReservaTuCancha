import api from './axios';
import type { Booking, CreateBookingPayload, TimeSlot } from '@/types';

export const bookingsApi = {
  create: async (payload: CreateBookingPayload): Promise<Booking> => {
    const { data } = await api.post<Booking>('/bookings', payload);
    return data;
  },

  getSlots: async (courtId: string, date: string): Promise<TimeSlot[]> => {
    const { data } = await api.get<TimeSlot[]>(`/bookings/slots?courtId=${courtId}&date=${date}`);
    return data;
  },

  cancelByToken: async (token: string): Promise<{ message: string }> => {
    const { data } = await api.get<{ message: string }>(`/bookings/cancel?token=${token}`);
    return data;
  },

  getOwnerBookings: async (): Promise<Booking[]> => {
    const { data } = await api.get<Booking[]>('/bookings/owner');
    return data;
  },

  getAll: async (page = 1, limit = 20) => {
    const { data } = await api.get(`/bookings?page=${page}&limit=${limit}`);
    return data;
  },
};
