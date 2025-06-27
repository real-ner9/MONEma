import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Slot, SlotDocument } from '../../slot/schemas/slot.schema';

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: UserDocument['_id'];

  @Prop({ type: Types.ObjectId, ref: Slot.name, required: true })
  slot: SlotDocument['_id'];

  @Prop({ default: false })
  reminder3daysSent: boolean;

  @Prop({ default: false })
  reminder1daySent: boolean;

  @Prop({ default: false })
  reminderTodaySent: boolean;
}

export type BookingDocument = Booking & Document;
export const BookingSchema = SchemaFactory.createForClass(Booking);
