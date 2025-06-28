import { OnModuleInit, Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';

@Injectable()
export class BotInitializer implements OnModuleInit {
  constructor(@InjectBot() private readonly bot: Telegraf) {}

  async onModuleInit() {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: '🚀 Запустить бота' },
      { command: 'menu', description: '👤 Показать профиль' },
      { command: 'sync', description: '🔒 Синхронизация слотов (admin)' },
    ]);
  }
}
