import { Injectable, Logger } from '@nestjs/common';
import { Slot, SlotDocument } from './schemas/slot.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Markup } from 'telegraf';
import { GoogleService } from '../google/google.service';

@Injectable()
export class SlotService {
  private readonly logger = new Logger(SlotService.name);

  constructor(
    @InjectModel(Slot.name) private slotModel: Model<SlotDocument>,
    private readonly googleService: GoogleService,
  ) {}

  async getSlotById(id: string): Promise<SlotDocument | null> {
    return this.slotModel.findById(id);
  }

  async getSlotKeyboard() {
    const slots = await this.slotModel.find({ isArchived: false }).sort({ date: 1 });

    const keyboard = slots
      .map((slot) => {
        const text = `${slot.date.toLocaleString('ru-RU')}`;
        // const places = `(мест: ${slot.maxBookings - slot.bookedCount})`

        return [
          {
            text,
            callback_data: `slot_${slot._id}`,
          },
        ];
      });
    return Markup.inlineKeyboard(keyboard);
  }

  async syncFromGoogle(): Promise<void> {
    const dtos = await this.googleService.fetchSlots();
    if (!dtos.length) {
      this.logger.warn('🟡 В Google таблице нет слотов');
      return;
    }

    let inserted = 0;
    let updated = 0;

    for (const dto of dtos) {
      const date = new Date(`${dto.date}T${dto.time}:00`);
      const externalId = `${dto.date}_${dto.time}`;

      const result = await this.slotModel.updateOne(
        { externalId },
        {
          $set: {
            date,
            isArchived: false,
          },
          $setOnInsert: {
            externalId,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount) {
        inserted++;
      } else if (result.modifiedCount) {
        updated++;
      }
    }

    this.logger.log(`✅ Слоты синхронизированы: добавлено ${inserted}, обновлено ${updated}`);
  }


  // @Cron(CronExpression.EVERY_HOUR)
  // async cronSyncFromGoogle() {
  //   this.logger.log('🕒 CRON: синхронизация слотов');
  //   await this.syncFromGoogle();
  // }
}
