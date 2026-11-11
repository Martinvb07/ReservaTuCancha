import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CajaTurnoDocument = CajaTurno & Document;

/** Plata que entra o sale de la caja por fuera de las reservas. */
@Schema({ _id: true, timestamps: false })
export class MovimientoCaja {
  @Prop({ enum: ['ingreso', 'gasto'], required: true })
  tipo: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  concepto: string;

  @Prop({ required: true, min: 0 })
  valor: number;

  @Prop({ required: true })
  fecha: Date;

  @Prop({ trim: true })
  por?: string;
}

/**
 * Un turno de caja: se abre con una base en efectivo, junta lo que se cobra
 * mientras está abierto y se cierra contando la plata. Al cerrar queda una
 * foto del resumen: lo que pase después con las reservas no la cambia.
 */
@Schema({ timestamps: true })
export class CajaTurno {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  abiertaEn: Date;

  /** Quién la abrió: el dueño o alguien de su equipo. */
  @Prop({ trim: true })
  abiertaPor?: string;

  /** Efectivo con el que arranca la caja. */
  @Prop({ required: true, min: 0, default: 0 })
  base: number;

  @Prop({ type: [MovimientoCaja], default: [] })
  movimientos: MovimientoCaja[];

  @Prop()
  cerradaEn?: Date;

  @Prop({ trim: true })
  cerradaPor?: string;

  /** Lo que había en el cajón al contar. */
  @Prop({ min: 0 })
  efectivoContado?: number;

  @Prop({ trim: true, maxlength: 500 })
  notas?: string;

  /** El resumen tal como quedó al cerrar (ver CajaTurnoService.resumen). */
  @Prop({ type: Object })
  cierre?: Record<string, any>;
}

export const CajaTurnoSchema = SchemaFactory.createForClass(CajaTurno);
CajaTurnoSchema.index({ ownerId: 1, cerradaEn: 1 });
CajaTurnoSchema.index({ ownerId: 1, abiertaEn: -1 });
