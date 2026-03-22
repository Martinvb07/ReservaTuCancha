export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  courtId: string | { _id: string; name: string; sport: string };
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  players?: number;
  notes?: string;
  status: BookingStatus;
  totalPrice: number;
  paymentId?: string;
  cancelToken: string;
  reviewToken: string;
  reviewTokenUsed: boolean;
  createdAt: string;
}

export interface CreateBookingPayload {
  courtId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  players?: number;
  notes?: string;
  totalPrice: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
