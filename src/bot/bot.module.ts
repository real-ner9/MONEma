import { forwardRef, Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { BookingModule } from '../booking/booking.module';
import { UserModule } from '../user/user.module';
import { SlotModule } from '../slot/slot.module';
import { BotInitializer } from './bot.initializer';
import { BotService } from './bot.service';
import { ReminderModule } from '../reminder/reminder.module';

@Module({
  imports: [
    forwardRef(() => BookingModule),
    SlotModule,
    UserModule,
    forwardRef(() => ReminderModule),
  ],
  providers: [BotUpdate, BotInitializer, BotService],
  exports: [BotService],
})
export class BotModule {}
