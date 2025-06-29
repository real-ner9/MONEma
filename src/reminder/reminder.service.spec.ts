import { Test, TestingModule } from '@nestjs/testing';
import { ReminderService } from './reminder.service';
import { BotService } from '../bot/bot.service';
import { BookingService } from '../booking/booking.service';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('ReminderService', () => {
  let service: ReminderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderService,
        { provide: BookingService, useValue: {} },
        { provide: BotService, useValue: {} },
        { provide: SchedulerRegistry, useValue: {} },
      ]
    }).compile();

    service = module.get<ReminderService>(ReminderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
