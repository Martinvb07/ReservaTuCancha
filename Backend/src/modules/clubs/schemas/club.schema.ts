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

  /**
   * Id del club como receptor en ePayco (su P_CUST_ID_CLIENTE).
   *
   * Con pagos divididos la plata ya no pasa por la cuenta de la empresa: ePayco
   * reparte en el momento del cobro y le consigna directo al club. Para eso el
   * club tiene que abrir su propia cuenta de ePayco, registrarse como comercio
   * y como receptor, y agregarnos como comercio asociado.
   *
   * Sin este id la cancha no se puede cobrar: no hay a dónde mandarle su parte.
   */
  @Prop({ trim: true })
  epaycoReceptorId?: string;

  /**
   * Cuenta bancaria del modelo anterior, cuando la empresa retenía el dinero y
   * giraba cada lunes. Se conserva solo como histórico: ya no se usa para
   * pagar. Sin ella no se pierde el rastro de a quién se le giró antes.
   */
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