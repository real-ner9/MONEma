import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  telegramId: string;

  @Prop()
  username: string;

  @Prop()
  phone: string;

  @Prop({ default: false })
  agreedToPolicy: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
