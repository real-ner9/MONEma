import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Slot {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  maxBookings: number;

  @Prop({ default: 0 })
  bookedCount: number;
}

export type SlotDocument = Slot & Document;
export const SlotSchema = SchemaFactory.createForClass(Slot);
