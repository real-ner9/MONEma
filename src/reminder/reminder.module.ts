import { ReminderService } from './reminder.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingModule } from '../booking/booking.module';
import { forwardRef, Module } from '@nestjs/common';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    forwardRef(() => BookingModule),
    forwardRef(() => BotModule),
    ScheduleModule.forRoot(),
  ],
  providers: [ReminderService],
  exports: [ReminderService]
})
export class ReminderModule {}
