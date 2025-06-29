import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { SlotDocument } from '../slot/schemas/slot.schema';
import { CrmService } from '../crm/crm.service';
import { ReminderService } from '../reminder/reminder.service';
import { GoogleService } from '../google/google.service';
import { UserService } from '../user/user.service';
import { SlotService } from '../slot/slot.service';
import { Types } from 'mongoose';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly crmService: CrmService,
    private readonly googleService: GoogleService,
    private readonly reminderService: ReminderService,
    private readonly userService: UserService,
    private readonly slotService: SlotService,
  ) {}

  async findByUserId(userId: Types.ObjectId): Promise<BookingDocument | null> {
    return this.bookingModel.findOne({ user: userId })
  }

  async findById(id: Types.ObjectId): Promise<BookingDocument | null> {
    return this.bookingModel.findById(id)
  }

  async createBooking(userTelegramId: string, slotId: string): Promise<Booking> {
    const user = await this.userService.findByTelegramId(userTelegramId);
    if (!user) throw new Error('Пользователь не найден');

    const slot: SlotDocument | null = await this.slotService.getSlotById(slotId);
    if (!slot) throw new Error('Слот не найден');

    // проверка на повторную запись
    const existing = await this.bookingModel.findOne({ user: user._id, slot: slot._id });
    if (existing) throw new Error('Вы уже записаны на этот слот');

    // создаём запись
    const booking = await this.bookingModel.create({
      user: user._id,
      slot: slot._id,
    });

    // отправка в Google Sheets
    try {
      await this.googleService.sendBookingToGoogleSheet({
        telegramId: user.telegramId,
        username: user.username || '',
        phone: user.phone || '',
        slotDate: slot.date.toLocaleDateString('ru-RU'),
        slotTime: slot.date.toLocaleTimeString('ru-RU'),
        slotId: slot._id!.toString(),
      });

      await this.bookingModel.findByIdAndUpdate(booking._id, { syncedToGoogle: true });
    } catch (e) {
      this.logger.error(`Google Sheets sync failed: ${e.message}`);
    }

    // отправка в Bitrix
    try {
      await this.crmService.sendBookingToBitrix({
        name: user.username || '',
        phone: user.phone || '',
        comment: `Запись на ${slot.date.toLocaleString('ru-RU')}`,
      });

      await this.bookingModel.findByIdAndUpdate(booking._id, { syncedToBitrix: true });
    } catch (e) {
      this.logger.error(`Bitrix sync failed: ${e.message}`);
    }

    // создаём напоминания
    await this.reminderService.scheduleReminders(booking._id);

    return booking;
  }

  async markReminderSent(id: Types.ObjectId, key: string) {
    await this.bookingModel.findByIdAndUpdate(id, { [key]: true });
  }
}
