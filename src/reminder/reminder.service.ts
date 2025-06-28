import { Inject, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../booking/schemas/booking.schema';
import { UserDocument } from '../user/schemas/user.schema';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { SlotDocument } from '../slot/schemas/slot.schema';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @Inject(getBotToken()) private readonly bot: Telegraf<any>,
  ) {}

  async scheduleReminders(bookingId: Types.ObjectId): Promise<void> {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate<{ user: UserDocument; slot: SlotDocument }>(['user', 'slot']);

    if (!booking) throw new Error('Booking not found');

    const { user, slot } = booking;
    if (!slot || !user) throw new Error('Slot or User not populated');

    const slotDate = slot.date;

    const reminders = [
      { key: 'reminder3daysSent' as const, offsetDays: 3 },
      { key: 'reminder1daySent' as const, offsetDays: 1 },
      { key: 'reminderTodaySent' as const, offsetDays: 0 },
    ];

    for (const { key, offsetDays } of reminders) {
      if (booking[key]) continue;

      const remindAt = new Date(slotDate);
      remindAt.setDate(remindAt.getDate() - offsetDays);
      remindAt.setHours(9, 0, 0, 0);

      const delay = remindAt.getTime() - Date.now();
      if (delay <= 0) continue;

      const jobName = `${bookingId}_${key}`;

      const timer = setTimeout(async () => {
        try {
          await this.bot.telegram.sendMessage(
            user.telegramId,
            `📅 Напоминание: вы записаны на кастинг в ${slot.date.toLocaleString('ru-RU')}`,
          );

          await this.bookingModel.findByIdAndUpdate(bookingId, { [key]: true });

          this.logger.log(`🔔 Reminder '${key}' sent for booking ${bookingId}`);
        } catch (e) {
          this.logger.error(`❌ Reminder '${key}' failed: ${e.message}`);
        }

        this.schedulerRegistry.deleteTimeout(jobName);
      }, delay);

      this.schedulerRegistry.addTimeout(jobName, timer);
    }
  }
}
