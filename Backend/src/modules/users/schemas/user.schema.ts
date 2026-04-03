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

  @Prop({ required: true })
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
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
