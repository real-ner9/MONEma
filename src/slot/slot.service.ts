import { Injectable, Logger } from '@nestjs/common';
import { Slot, SlotDocument } from './schemas/slot.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Markup } from 'telegraf';
import { GoogleService } from '../google/google.service';
import { Cron, CronExpression } from '@nestjs/schedule';

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
    const slots = await this.slotModel.find().sort({ date: 1 });
    const keyboard = slots.map((slot) => [
      {
        text: `${slot.date.toLocaleString('ru-RU')} (мест: ${slot.maxBookings - slot.bookedCount})`,
        callback_data: `slot_${slot._id}`,
      },
    ]);
    return Markup.inlineKeyboard(keyboard);
  }

  async syncFromGoogle(): Promise<void> {
    const dtos = await this.googleService.fetchSlots();
    if (!dtos.length) {
      this.logger.warn('🟡 В Google таблице нет слотов');
      return;
    }

    const newSlots = dtos.map((dto) => ({
      date: new Date(`${dto.date}T${dto.time}:00`),
      maxBookings: Number(dto.maxBookings),
    }));

    // ❌ Удаляем все старые
    await this.slotModel.deleteMany({});
    this.logger.log('🧨 Все старые слоты удалены');

    // ✅ Добавляем новые
    await this.slotModel.insertMany(newSlots);
    this.logger.log(`✅ Импортировано ${newSlots.length} свежих слотов из Google`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cronSyncFromGoogle() {
    this.logger.log('🕒 CRON: синхронизация слотов');
    await this.syncFromGoogle();
  }
}
