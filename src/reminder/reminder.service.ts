import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../booking/schemas/booking.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(getBotToken()) private readonly bot: Telegraf<any>,
  ) {}

  async scheduleReminders(bookingId: string, slotDate: Date) {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('user');
    if (!booking) throw new Error('Booking not found');

    const user = booking.user as unknown as UserDocument;

    const dates = [
      { key: 'reminder3Sent', offsetDays: 3 },
      { key: 'reminder1Sent', offsetDays: 1 },
      { key: 'reminderTodaySent', offsetDays: 0 },
    ];

    for (const reminder of dates) {
      const remindDate = new Date(slotDate);
      remindDate.setDate(remindDate.getDate() - reminder.offsetDays);
      remindDate.setHours(9, 0, 0, 0); // Уведомление в 9:00

      const jobName = `${bookingId}_${reminder.key}`;

      const timeout = remindDate.getTime() - Date.now();
      if (timeout <= 0) continue; // не ставим просроченные

      const timer = setTimeout(async () => {
        try {
          await this.bot.telegram.sendMessage(
            user.telegramId,
            `Напоминание: вы записаны на ${slotDate.toLocaleString('ru-RU')}`,
          );

          await this.bookingModel.findByIdAndUpdate(bookingId, {
            [reminder.key]: true,
          });
          this.logger.log(
            `Reminder '${reminder.key}' sent for booking ${bookingId}`,
          );
        } catch (e) {
          this.logger.error(`Reminder '${reminder.key}' failed: ${e.message}`);
        }

        this.schedulerRegistry.deleteTimeout(jobName);
      }, timeout);

      this.schedulerRegistry.addTimeout(jobName, timer);
    }
  }
}
