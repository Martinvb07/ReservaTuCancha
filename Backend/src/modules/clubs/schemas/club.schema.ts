import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClubDocument = Club & Document;

/** Por dónde le giramos a un club su liquidación semanal. */
export const METODOS_PAGO = ['bancolombia', 'nequi', 'daviplata', 'breb'] as const;

/** Cómo identifica el titular su llave Bre-B. */
export const TIPOS_LLAVE = ['alfanumerica', 'celular', 'correo', 'documento'] as const;

@Schema({ _id: false })
export class DatosBancarios {
  /* Qué campos vienen llenos depende del método: una cuenta bancaria usa
     tipoCuenta + numero, las billeteras solo numero (el celular) y Bre-B
     reemplaza el número por la llave. */
  @Prop({ enum: METODOS_PAGO, trim: true })
  metodo?: string;

  @Prop({ trim: true })
  titular?: string;

  /** Cédula o NIT del titular */
  @Prop({ trim: true })
  documento?: string;

  /** Nombre visible del banco o billetera, para el panel de liquidación */
  @Prop({ trim: true })
  banco?: string;

  /** Solo en cuentas bancarias */
  @Prop({ enum: ['ahorros', 'corriente'], trim: true })
  tipoCuenta?: string;

  /** Número de cuenta, o el celular en Nequi y Daviplata */
  @Prop({ trim: true })
  numero?: string;

  /** Llave Bre-B: puede ser @alias, celular, correo o documento */
  @Prop({ trim: true })
  llave?: string;

  @Prop({ enum: TIPOS_LLAVE, trim: true })
  tipoLlave?: string;
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