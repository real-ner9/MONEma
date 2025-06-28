import { Context } from 'telegraf';

export interface RegistrationDraft {
  telegramId: string;
  username?: string;
  fullName: string;
  phone: string;
  portfolioUrl: string;
  selectedSlotId: string;
}

export interface SessionData {
  step?: 'fullName' | 'phone' | 'portfolio' | 'slot' | 'confirm';
  data: Partial<RegistrationDraft>;
}

export interface MyContext extends Context {
  session: SessionData | null;
  match: RegExpMatchArray;
}
