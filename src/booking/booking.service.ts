import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Slot, SlotDocument } from '../slot/schemas/slot.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { CrmService } from '../crm/crm.service';
import { ReminderService } from '../reminder/reminder.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Slot.name) private slotModel: Model<SlotDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly crmService: CrmService,
    private readonly reminderService: ReminderService,
  ) {}

  async createBooking(userTelegramId: string, slotId: string): Promise<Booking> {
    const user = await this.userModel.findOne({ telegramId: userTelegramId });
    if (!user) throw new Error('Пользователь не найден');

    const slot: SlotDocument | null = await this.slotModel.findById(slotId);
    if (!slot) throw new Error('Слот не найден');
    if (slot.bookedCount >= slot.maxBookings) throw new Error('Слот переполнен');

    // проверка на повторную запись
    const existing = await this.bookingModel.findOne({ user: user._id, slot: slot._id });
    if (existing) throw new Error('Вы уже записаны на этот слот');

    // создаём запись
    const booking = await this.bookingModel.create({
      user: user._id,
      slot: slot._id,
    });

    // увеличиваем счётчик слота
    await this.slotModel.findByIdAndUpdate(slot._id, { $inc: { bookedCount: 1 } });

    // отправка в Google Sheets
    try {
      await this.crmService.sendBookingToGoogleSheet({
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
    await this.reminderService.scheduleReminders(booking._id as string, slot.date);

    return booking;
  }
}
