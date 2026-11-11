import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClienteBloqueadoDocument = ClienteBloqueado & Document;

/**
 * Un cliente al que un club no le recibe más reservas en línea (por ejemplo,
 * porque reserva y no llega). El bloqueo es por club: en las canchas de otros
 * clubes esa persona sigue reservando normal.
 */
@Schema({ timestamps: true })
export class ClienteBloqueado {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  /** Celular en solo dígitos, sin indicativo (los últimos 10). */
  @Prop({ trim: true })
  telefono?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  nombre?: string;

  @Prop({ trim: true, maxlength: 200 })
  motivo?: string;
}

export const ClienteBloqueadoSchema = SchemaFactory.createForClass(ClienteBloqueado);
ClienteBloqueadoSchema.index({ ownerId: 1, telefono: 1 });
ClienteBloqueadoSchema.index({ ownerId: 1, email: 1 });
