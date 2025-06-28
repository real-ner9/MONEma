import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Slot {
  @Prop({ required: true, unique: true })
  externalId: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: false })
  isArchived: boolean;

  // @Prop({ required: true })
  // maxBookings: number;
}

export type SlotDocument = Slot & Document<Types.ObjectId>;
export const SlotSchema = SchemaFactory.createForClass(Slot);
