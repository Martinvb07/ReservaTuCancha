import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClubDocument = Club & Document;

@Schema({ _id: false })
export class DatosBancarios {
  @Prop({ trim: true })
  titular?: string;

  /** Cédula o NIT del titular */
  @Prop({ trim: true })
  documento?: string;

  /** Bancolombia, Nequi, Daviplata... */
  @Prop({ trim: true })
  banco?: string;

  @Prop({ enum: ['ahorros', 'corriente', 'nequi', 'daviplata'], trim: true })
  tipoCuenta?: string;

  @Prop({ trim: true })
  numero?: string;
}

@Schema({ timestamps: true })
export class Club {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  logo?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  contactEmail?: string;

  @Prop()
  contactPhone?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerUserId: Types.ObjectId;

  // --- Cuenta donde recibe la liquidación semanal ---
  // Los cobros entran a la cuenta Wompi de ReservaTuCancha; cada lunes se le
  // transfiere al club su parte a estos datos.
  @Prop({ type: DatosBancarios })
  banco?: DatosBancarios;

  @Prop({ trim: true, lowercase: true })
  slug?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ trim: true })
  slogan?: string;

  @Prop({ trim: true })
  schedule?: string;

  @Prop({ type: Object, default: {} })
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
  };
}

export const ClubSchema = SchemaFactory.createForClass(Club);
ClubSchema.index({ slug: 1 }, { unique: true, sparse: true });