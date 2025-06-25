import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Slot', required: true })
  slot: Types.ObjectId;

  @Prop({ default: false })
  reminder3daysSent: boolean;

  @Prop({ default: false })
  reminder1daySent: boolean;

  @Prop({ default: false })
  reminderTodaySent: boolean;
}

export type BookingDocument = Booking & Document;
export const BookingSchema = SchemaFactory.createForClass(Booking);
