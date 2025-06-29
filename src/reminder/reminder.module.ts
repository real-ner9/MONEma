import { ReminderService } from './reminder.service';
import { BookingModule } from '../booking/booking.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BookingModule,
  ],
  providers: [ReminderService],
  exports: [ReminderService]
})
export class ReminderModule {}
