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
  /** Lo que le llega al club: total menos pasarela y parte de la plataforma */
  netoDueno?: number;
  paymentId?: string;
  cancelToken: string;
  bookingCode: string;
  reviewToken: string;
  reviewTokenUsed: boolean;
  /** 'manual' = la anotó el club (teléfono, mostrador) y se cobra en el club. */
  origen?: 'online' | 'manual';
  paymentMethod?: 'epayco' | 'wompi' | 'club';
  /** Turno fijo: las fechas de una misma serie comparten este id. */
  serieId?: string;
  /** El club marcó que el cliente no llegó a su turno. */
  noShow?: boolean;
  serieOrden?: number;
  createdAt: string;
}

/** La reserva la anotó el club y no pasó por el cobro en línea. */
export const esManual = (b: Pick<Booking, 'origen'> | null | undefined) => b?.origen === 'manual';

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
