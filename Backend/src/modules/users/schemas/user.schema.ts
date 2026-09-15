import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  /* Fuera de las consultas por defecto: el hash solo lo necesita el login,
     que lo pide con +passwordHash. */
  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ enum: UserRole, default: UserRole.OWNER })
  role: UserRole;

  @Prop({ trim: true })
  phone?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ enum: ['basico', 'pro', 'empresarial'], default: 'basico' })
  plan: string;

  @Prop({ enum: ['activa', 'trial', 'vencida', 'cancelada'], default: 'trial' })
  subscriptionEstado: string;

  @Prop()
  subscriptionEndsAt?: Date;

  @Prop()
  subscriptionStartedAt?: Date;

  /* Tiene que ser select:false para que `+refreshToken` funcione: sobre un
     campo que ya viene por defecto, Mongoose lo manda como inclusion y Mongo
     rechaza la proyeccion por mezclarla con una exclusion. Eso era el 500 del
     refresh que mataba toda sesion a los 15 minutos. */
  @Prop({ select: false })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
