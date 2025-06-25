import { ReminderService } from './reminder.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingModule } from '../booking/booking.module';
import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    forwardRef(() => BookingModule),
    UserModule,
    TelegrafModule,
    ScheduleModule.forRoot()
  ],
  providers: [ReminderService],
  exports: [ReminderService]
})
export class ReminderModule {}
