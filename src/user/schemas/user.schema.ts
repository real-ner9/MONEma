// src/user/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Slot, SlotDocument } from '../../slot/schemas/slot.schema';

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  telegramId: string;

  @Prop()
  username?: string;

  @Prop()
  fullName: string;

  @Prop()
  phone: string;

  @Prop()
  portfolioUrl: string;

  @Prop({ type: Types.ObjectId, ref: Slot.name, required: true })
  selectedSlot: SlotDocument['_id'];

  @Prop({ default: false })
  isCompleted: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
