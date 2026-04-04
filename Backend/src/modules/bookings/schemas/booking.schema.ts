import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
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

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  @Prop({ trim: true })
  wompiTransactionId?: string; // ID interno de Wompi para seguimiento

  @Prop({ enum: ['wompi', 'efectivo'], default: 'wompi' })
  paymentMethod: string;

  // ─── Tokens para acciones sin login ──────────────────────────────────
  @Prop({ required: true, unique: true })
  cancelToken: string; // UUID — enviado por email para cancelar sin login

  // Código corto y único para mostrar al usuario
  @Prop({ required: true, unique: true, uppercase: true, trim: true, length: 8 })
  bookingCode: string;

  @Prop({ required: true, unique: true })
  reviewToken: string; // UUID — enviado post-reserva para dejar reseña

  @Prop({ default: false })
  reviewTokenUsed: boolean;

  @Prop({ default: false })
  reminderSent: boolean;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Índices para búsquedas frecuentes
BookingSchema.index({ courtId: 1, date: 1 });
BookingSchema.index({ guestEmail: 1 });
BookingSchema.index({ cancelToken: 1 });
BookingSchema.index({ reviewToken: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ bookingCode: 1 });
BookingSchema.index({ wompiTransactionId: 1 }); // Nuevo índice para el Webhook