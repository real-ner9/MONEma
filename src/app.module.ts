import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { BotModule } from './bot/bot.module';
import { BookingModule } from './booking/booking.module';
import { SlotModule } from './slot/slot.module';
import { ReminderModule } from './reminder/reminder.module';
import { UserModule } from './user/user.module';
import { CrmModule } from './crm/crm.module';
import { session } from 'telegraf';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.development.local' }),
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN as string,
      middlewares: [session()],
    }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    ScheduleModule.forRoot(),
    BotModule,
    BookingModule,
    SlotModule,
    ReminderModule,
    UserModule,
    CrmModule,
  ],
})
export class AppModule {}
