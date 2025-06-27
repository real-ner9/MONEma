import { Injectable } from '@nestjs/common';
import { Slot, SlotDocument } from './schemas/slot.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Markup } from 'telegraf';

@Injectable()
export class SlotService {
  private readonly testSlots: (Slot & {_id: string})[] = [
    {
      _id: '1',
      date: new Date('2025-07-01T10:00:00'),
      maxBookings: 3,
      bookedCount: 0,
    },
    {
      _id: '2',
      date: new Date('2025-07-01T11:00:00'),
      maxBookings: 3,
      bookedCount: 1,
    },
  ];

  constructor(
    @InjectModel(Slot.name) private slotModel: Model<SlotDocument>,
  ) {}

  getAvailableSlots(): Slot[] {
    return this.testSlots.filter(s => s.bookedCount < s.maxBookings);
  }

  async getSlotById(id: string): Promise<SlotDocument | null> {
    return this.slotModel.findById(id);
  }

  async getSlotKeyboard() {
    // const slots = await this.slotModel.find().sort({ date: 1 });
    const keyboard = this.testSlots.map((slot) => [
      {
        text: `${slot.date.toLocaleString('ru-RU')} (мест: ${slot.maxBookings - slot.bookedCount})`,
        callback_data: `slot_${slot._id}`,
      },
    ]);
    return Markup.inlineKeyboard(keyboard);
  }
}
