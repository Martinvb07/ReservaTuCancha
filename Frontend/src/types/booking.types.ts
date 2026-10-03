/**
 * Estados que ve el club: confirmada, reagendada y completada.
 * `pending` es interno y transitorio — la reserva existe pero aún no se paga;
 * si el pago no llega en 30 minutos, el backend la borra.
 */
export type BookingStatus = 'pending' | 'confirmed' | 'reagendada' | 'completed';

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
  /** Lo que pagó el jugador: precio de la cancha + tarifa de servicio */
  totalPrice: number;
  /** Precio de lista del turno, sin la tarifa */
  precioCancha?: number;
  /** Tarifa fija de la plataforma, cobrada al jugador */
  tarifaServicio?: number;
  paymentId?: string;
  cancelToken: string;
  bookingCode: string;
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
  /* El total lo calcula el servidor: mandarlo no cambia lo que se cobra. */
  totalPrice?: number;
  paymentMethod?: 'epayco';
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
