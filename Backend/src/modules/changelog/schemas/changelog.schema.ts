// src/modules/changelog/schemas/changelog.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChangelogDocument = Changelog & Document;

@Schema({ timestamps: true })
export class Changelog {
  @Prop({ required: true }) titulo: string;
  @Prop({ required: true }) descripcion: string;
  @Prop() version?: string;
  @Prop({ default: 'nueva_funcion' }) tag: string;
  @Prop({ default: 'todos' }) destinatarios: string;
}

export const ChangelogSchema = SchemaFactory.createForClass(Changelog);