import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourtDocument = Court & Document;

export enum SportType {
  FUTBOL = 'futbol',
  PADEL = 'padel',
  VOLEY_PLAYA = 'voley_playa',
}

@Schema({ _id: false })
export class GeoLocation {
  @Prop({ required: true })
  address: string;

  @Prop({ type: [Number], index: '2dsphere' })
  coordinates: [number, number]; // [lng, lat]

  @Prop()
  city: string;

  @Prop()
  department: string;
}

@Schema({ _id: false })
export class AvailabilitySlot {
  @Prop({ required: true })
  dayOfWeek: number; // 0=Domingo, 6=Sábado

  @Prop({ required: true })
  openTime: string; // "07:00"

  @Prop({ required: true })
  closeTime: string; // "22:00"

  @Prop({ default: 60 })
  slotDurationMinutes: number;
}

@Schema({ timestamps: true })
export class Court {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ enum: SportType, required: true })
  sport: SportType;

  @Prop({ type: GeoLocation, required: true })
  location: GeoLocation;

  @Prop({ required: true, min: 0 })
  pricePerHour: number;

  @Prop({ default: 'COP' })
  currency: string;

  @Prop({ type: [String], default: [] })
  photos: string[]; // Cloudinary URLs

  @Prop({ type: [AvailabilitySlot], default: [] })
  availability: AvailabilitySlot[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ type: [String], default: [] })
  amenities: string[]; // ['Luz nocturna', 'Duchas', 'Parking']
}

export const CourtSchema = SchemaFactory.createForClass(Court);
CourtSchema.index({ sport: 1, isActive: 1 });
CourtSchema.index({ 'location.city': 1 });
CourtSchema.index({ ownerId: 1 });
CourtSchema.index({ averageRating: -1 });
