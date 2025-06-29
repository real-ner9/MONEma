import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingService } from './booking.service';
import { SlotModule } from '../slot/slot.module';
import { UserModule } from '../user/user.module';
import { CrmModule } from '../crm/crm.module';
import { ReminderModule } from '../reminder/reminder.module';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    CrmModule,
    GoogleModule,
    forwardRef(() => ReminderModule),
    UserModule,
    SlotModule,
  ],
  exports: [MongooseModule, BookingService],
  providers: [BookingService],
})
export class BookingModule {}
