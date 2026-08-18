import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LiquidacionDocument = Liquidacion & Document;

export enum LiquidacionEstado {
  PENDIENTE = 'pendiente',
  GIRADA = 'girada',
}

/**
 * Lo que se le gira a un club por una semana.
 *
 * Los montos se calculan al vuelo desde las reservas mientras el periodo está
 * abierto; este documento se crea al marcar el giro, y guarda una foto de los
 * numeros de ese momento para que el historial no cambie si después se toca
 * una reserva vieja.
 */
@Schema({ timestamps: true })
export class Liquidacion {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ trim: true })
  clubNombre?: string;

  /** Inicio del periodo, inclusive (domingo 12:00 hora Colombia) */
  @Prop({ required: true })
  periodoInicio: Date;

  /** Fin del periodo, exclusivo */
  @Prop({ required: true })
  periodoFin: Date;

  @Prop({ required: true, default: 0 })
  reservas: number;

  /** Suma de lo que pagaron los jugadores */
  @Prop({ required: true, default: 0 })
  bruto: number;

  /** Porcentaje aplicado, guardado por si la tarifa cambia más adelante */
  @Prop({ required: true })
  comisionPorcentaje: number;

  @Prop({ required: true, default: 0 })
  comision: number;

  /** Lo que efectivamente se le transfiere al club */
  @Prop({ required: true, default: 0 })
  neto: number;

  @Prop({ enum: LiquidacionEstado, default: LiquidacionEstado.PENDIENTE })
  estado: LiquidacionEstado;

  @Prop()
  giradaAt?: Date;

  /** Número de la transferencia, para poder rastrearla después */
  @Prop({ trim: true })
  referencia?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Booking', default: [] })
  bookingIds: Types.ObjectId[];
}

export const LiquidacionSchema = SchemaFactory.createForClass(Liquidacion);

// Una sola liquidación por club y periodo
LiquidacionSchema.index({ ownerId: 1, periodoInicio: 1 }, { unique: true });
LiquidacionSchema.index({ periodoInicio: -1 });
