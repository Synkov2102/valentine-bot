import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ValentineDocument = Valentine & Document;

@Schema()
export class Valentine {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  from: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ required: true })
  viewed: boolean;
}

export const ValentineSchema = SchemaFactory.createForClass(Valentine);
