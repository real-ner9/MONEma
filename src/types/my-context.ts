// src/bot/types/my-context.ts

import { Context } from 'telegraf';
import { UserDocument } from '../user/schemas/user.schema';

export interface SessionData {
  step?: 'fullName' | 'phone' | 'portfolio' | 'slot' | 'confirm';
  data: Partial<UserDocument>;
}

export interface MyContext extends Context {
  session: SessionData | null;
  match: RegExpMatchArray;
}
