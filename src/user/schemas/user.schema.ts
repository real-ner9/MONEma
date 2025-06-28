import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({ default: Date.now })
  createdAt?: Date;
}

export type UserDocument = User & Document<Types.ObjectId>;
export const UserSchema = SchemaFactory.createForClass(User);
