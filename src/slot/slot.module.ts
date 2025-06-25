import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Slot, SlotSchema } from './schemas/slot.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }]),
  ],
  exports: [MongooseModule],
})
export class SlotModule {}
