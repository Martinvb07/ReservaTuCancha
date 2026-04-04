import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlockedSlotDocument = BlockedSlot & Document;

@Schema({ timestamps: true })
export class BlockedSlot {
  @Prop({ type: Types.ObjectId, ref: 'Court', required: true })
  courtId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string; // "09:00"

  @Prop({ required: true })
  endTime: string; // "10:00"

  @Prop({ trim: true })
  reason?: string; // "Mantenimiento", "Torneo privado", etc.
}

export const BlockedSlotSchema = SchemaFactory.createForClass(BlockedSlot);
BlockedSlotSchema.index({ courtId: 1, date: 1 });
