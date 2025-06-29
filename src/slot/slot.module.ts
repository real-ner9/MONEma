import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Slot, SlotSchema } from './schemas/slot.schema';
import { SlotService } from './slot.service';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }]),
    GoogleModule, // Assuming GoogleModule is defined elsewhere
  ],
  exports: [MongooseModule, SlotService],
  providers: [SlotService],
})
export class SlotModule {}
