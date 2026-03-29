import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema({ timestamps: true })
export class Solicitud extends Document {
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) businessName: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) department: string;
  @Prop({ required: true }) nit: string;
  @Prop({ required: true }) phone: string;
  @Prop() message: string;
  @Prop({ default: 'pendiente' }) estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export const SolicitudSchema = SchemaFactory.createForClass(Solicitud);
