import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClubDocument = Club & Document;

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

  // --- Configuración de Wompi ---
  @Prop({ trim: true })
  wompiMerchantId?: string;

  @Prop({ trim: true })
  wompiPublicKey?: string;

  @Prop({ trim: true })
  wompiApiKey?: string;

  @Prop({ trim: true })
  wompiEventsSecret?: string;

  @Prop({ trim: true })
  wompiIntegritySecret?: string;

  @Prop({ default: false })
  wompiConfigured?: boolean;

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