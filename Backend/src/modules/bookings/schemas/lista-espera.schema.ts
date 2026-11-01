import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ListaEsperaDocument = ListaEspera & Document;

/**
 * Alguien que quiere un turno ocupado y pidió que le avisen si se libera
 * (un pago que no pasó, una reserva que se movió, un bloqueo que se quitó).
 */
@Schema({ timestamps: true, collection: 'listaespera' })
export class ListaEspera {
  @Prop({ type: Types.ObjectId, ref: 'Court', required: true })
  courtId: Types.ObjectId;

  /** Día del turno, "YYYY-MM-DD". */
  @Prop({ required: true })
  fecha: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  nombre?: string;

  @Prop({ select: false, trim: true })
  pushToken?: string;

  @Prop({ default: false })
  avisado: boolean;

  /** Mongo borra la entrada sola cuando el turno ya pasó (índice TTL). */
  @Prop({ required: true })
  expira: Date;
}

export const ListaEsperaSchema = SchemaFactory.createForClass(ListaEspera);
ListaEsperaSchema.index({ courtId: 1, fecha: 1, startTime: 1, email: 1 }, { unique: true });
ListaEsperaSchema.index({ avisado: 1, fecha: 1 });
ListaEsperaSchema.index({ expira: 1 }, { expireAfterSeconds: 0 });
