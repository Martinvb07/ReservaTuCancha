import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  /* Interno y transitorio: la reserva existe pero aún no se ha pagado. No se
     le muestra al club; si el pago no llega en 30 minutos, el cron la borra. */
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  /** Se movió de horario. Sigue activa: ocupa el turno nuevo y se liquida. */
  REAGENDADA = 'reagendada',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Booking {
  // ─── Relación con cancha ───────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Court', required: true })
  courtId: Types.ObjectId;

  // ─── Datos del cliente (sin login) ────────────────────────────────────
  @Prop({ required: true, trim: true })
  guestName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  guestEmail: string;

  @Prop({ required: true, trim: true })
  guestPhone: string;

  // ─── Detalles de la reserva ───────────────────────────────────────────
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string; // "09:00"

  @Prop({ required: true })
  endTime: string; // "10:00"

  @Prop({ default: 1 })
  players: number;

  @Prop({ trim: true })
  notes?: string;

  // ─── Estado y pago ────────────────────────────────────────────────────
  @Prop({ enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  /** Lo que el jugador paga en el checkout: precio de la cancha + tarifa. */
  @Prop({ required: true })
  totalPrice: number;

  /* ── Desglose del cobro ──────────────────────────────────────────────
     Se congela al crear la reserva. Si manana sube la tarifa de ePayco o
     cambia la ganancia de la plataforma, lo ya cobrado y lo que se le debe al
     club no se mueve: el split reparte estos campos, no los recalcula.

     Las reservas viejas (modelo de comision por porcentaje) no los tienen; la
     liquidacion cae al calculo antiguo cuando faltan. */

  /** Precio de lista del turno, sin la tarifa de servicio */
  @Prop()
  precioCancha?: number;

  /** Tarifa fija que paga el jugador por usar la plataforma */
  @Prop({ default: 0 })
  tarifaServicio?: number;

  /** Lo que se queda ePayco, con IVA incluido */
  @Prop({ default: 0 })
  costoPasarela?: number;

  /** Lo que le queda limpio a ReservaTuCancha */
  @Prop({ default: 0 })
  gananciaPlataforma?: number;

  /** Lo que se le gira al club por esta reserva */
  @Prop({ default: 0 })
  netoDueno?: number;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  /** Referencia de ePayco (x_ref_payco), la que sirve para rastrear el cobro */
  @Prop({ trim: true })
  epaycoRefPayco?: string;

  /** Id de la transaccion en ePayco (x_transaction_id) */
  @Prop({ trim: true })
  epaycoTransactionId?: string;

  /** Historico: reservas cobradas con Wompi, antes del cambio a ePayco */
  @Prop({ trim: true })
  wompiTransactionId?: string;

  /* Solo se cobra en linea. El efectivo se retiro: la plata tiene que pasar
     por la cuenta de la empresa para poder retener la comision y liquidar.
     'wompi' sigue en el enum por las reservas anteriores al cambio. */
  @Prop({ enum: ['epayco', 'wompi'], default: 'epayco' })
  paymentMethod: string;

  // ─── Tokens para acciones sin login ──────────────────────────────────
  /* select:false a proposito: la busqueda publica por correo devolvia este
     token, y con el cualquiera movia la reserva de otro. Solo lo entregan las
     consultas que lo piden explicito con +cancelToken. */
  @Prop({ required: true, unique: true, select: false })
  cancelToken: string; // UUID — enviado por email para cancelar sin login

  // Código corto y único para mostrar al usuario
  @Prop({ required: true, unique: true, uppercase: true, trim: true, length: 8 })
  bookingCode: string;

  @Prop({ required: true, unique: true, select: false })
  reviewToken: string; // UUID — enviado post-reserva para dejar reseña

  @Prop({ default: false })
  reviewTokenUsed: boolean;

  @Prop({ default: false })
  reminderSent: boolean;

  /** Cuántas veces el jugador movió el horario de esta reserva */
  @Prop({ default: 0 })
  reprogramaciones: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Índices para búsquedas frecuentes
BookingSchema.index({ courtId: 1, date: 1 });
BookingSchema.index({ guestEmail: 1 });
BookingSchema.index({ cancelToken: 1 });
BookingSchema.index({ reviewToken: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ bookingCode: 1 });
BookingSchema.index({ wompiTransactionId: 1 }); // histórico, cobros con Wompi
BookingSchema.index({ epaycoRefPayco: 1 });     // búsqueda desde la confirmación