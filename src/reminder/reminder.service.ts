import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { UserDocument } from '../user/schemas/user.schema';
import { SlotDocument } from '../slot/schemas/slot.schema';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly bookingService: BookingService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async scheduleReminders(bookingId: Types.ObjectId): Promise<void> {
    const booking = await this.bookingService.findById(bookingId)
    if (!booking) throw new Error('Booking not found');

    await booking.populate<{ user: UserDocument; slot: SlotDocument }>(['user', 'slot']);

    const user = booking.user as unknown as UserDocument;
    const slot = booking.slot as unknown as SlotDocument;
    if (!slot || !user) throw new Error('Slot or User not populated');

    const reminders = [
      { key: 'reminder3daysSent' as const, offsetDays: 3 },
      { key: 'reminder1daySent' as const, offsetDays: 1 },
      { key: 'reminderTodaySent' as const, offsetDays: 0 },
    ];

    for (const { key, offsetDays } of reminders) {
      if (booking[key]) continue;

      const remindAt = new Date(slot.date);
      remindAt.setDate(remindAt.getDate() - offsetDays);
      remindAt.setHours(9, 0, 0, 0);

      const delay = remindAt.getTime() - Date.now();
      if (delay <= 0) continue;

      const jobName = `${bookingId}_${key}`;

      const timer = setTimeout(async () => {
        try {
          await this.bookingService.markReminderSent(bookingId, key);
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
