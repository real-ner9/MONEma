import { forwardRef, Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { BookingModule } from '../booking/booking.module';
import { UserModule } from '../user/user.module';
import { SlotModule } from '../slot/slot.module';
import { BotInitializer } from './bot.initializer';
import { BotService } from './bot.service';

@Module({
  imports: [
    forwardRef(() => BookingModule),
    SlotModule,
    UserModule,
  ],
  providers: [BotUpdate, BotInitializer, BotService],
  exports: [BotService],
})
export class BotModule {}
