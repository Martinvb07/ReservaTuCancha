import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DispositivoPushDocument = DispositivoPush & Document;

/**
 * Un teléfono del club que recibe avisos push (nueva reserva pagada...).
 *
 * Los jugadores no tienen cuenta: su token viaja en la propia reserva
 * (Booking.pushToken). Aquí solo quedan los del panel.
 */
@Schema({ timestamps: true })
export class DispositivoPush {
  @Prop({ required: true, unique: true, trim: true })
  token: string;

  /** Dueño del club. Los empleados registran sus teléfonos a nombre del club. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** Quién inició sesión en ese teléfono (el dueño o un empleado). */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  cuentaId?: Types.ObjectId;

  @Prop({ enum: ['android', 'ios', 'web'], default: 'android' })
  plataforma: string;
}

export const DispositivoPushSchema = SchemaFactory.createForClass(DispositivoPush);
