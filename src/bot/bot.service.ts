import { Injectable } from '@nestjs/common';
import { MyContext, RegistrationDraft } from '../types/my-context';
import { BookingService } from '../booking/booking.service';
import { SlotService } from '../slot/slot.service';
import { UserService } from '../user/user.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { SlotDocument } from '../slot/schemas/slot.schema';
import { InlineKeyboardMarkup } from '@telegraf/types/markup';

@Injectable()
export class BotService {
  constructor(
    private readonly bookingService: BookingService,
    private readonly slotService: SlotService,
    private readonly userService: UserService,
    @InjectBot() private readonly bot: Telegraf<MyContext>
  ) {}

  async sendReminder(telegramId: string, slotDate: Date) {
    await this.bot.telegram.sendMessage(
      telegramId,
      `📅 Напоминание: вы записаны на кастинг в ${slotDate.toLocaleString('ru-RU')}`
    );
  }

  async askSlot(ctx: MyContext) {
    const keyboard = await this.slotService.getSlotKeyboard();
    await ctx.reply('Выберите слот:', keyboard);
    return;
  }

  async confirmSession(ctx: MyContext) {
    if (!ctx.session) return;
    const data = ctx.session.data as RegistrationDraft;
    if (!data) {
      await ctx.reply('Ошибка: данные сессии не найдены. Пожалуйста, начните заново.');
      return;
    }

    await this.userService.createUser({
      telegramId: data.telegramId,
      fullName: data.fullName,
      phone: data.phone,
      portfolioUrl: data.portfolioUrl,
      username: data.username,
    });
    await this.bookingService.createBooking(data.telegramId, data.selectedSlotId);
    ctx.session = null;

    await ctx.reply('✅ Спасибо! Вы успешно записаны на кастинг.');
    return;
  }

  async handleStart(ctx: MyContext) {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId || !ctx.session) return;

    const existingUser = await this.userService.findByTelegramId(telegramId);
    if (existingUser) {
      await ctx.reply('Вы уже зарегистрированы.');
      // await this.handleMenu(ctx);
      return;
    }

    ctx.session.step = 'fullName';
    ctx.session.data = { telegramId, username: ctx.from?.username || '' };

    await ctx.reply('Добро пожаловать! Введите ваше ФИО:');
    return;
  }

  async handleProfile(ctx: MyContext) {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) {
      await ctx.reply('Не удалось получить Telegram ID');
      return;
    }

    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      await ctx.reply('Вы ещё не зарегистрированы. Напишите /start.');
      return;
    }

    const booking = await this.bookingService.findByUserId(user._id);
    if (!booking) {
      await ctx.reply('Вы ещё не записаны на кастинг.');
      return;
    }

    await booking.populate<{ slot: SlotDocument }>('slot');
    const slot = booking.slot as unknown as SlotDocument;

    const date = slot?.date
      ? slot.date.toLocaleString('ru-RU')
      : 'не выбрана';

    await ctx.reply(
      `👤 Профиль:\n\nФИО: ${user.fullName}\nТелефон: ${user.phone}\nПортфолио: ${user.portfolioUrl}\nДата: ${date}`
    );
    return;
  }

  async handleSyncCommand(ctx: MyContext) {
    await this.slotService.syncFromGoogle();
    await ctx.reply('🔁 Слоты успешно синхронизированы');
    return;
  }

  async handleMenu(ctx: MyContext) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      await ctx.reply('Ошибка получения ID');
      return;
    }

    const user = await this.userService.findByTelegramId(telegramId);

    const keyboard: InlineKeyboardMarkup['inline_keyboard'] = [];

    if (user) {
      keyboard.push([{ text: '👤 Профиль', callback_data: 'profile' }]);
    } else {
      keyboard.push([{ text: '🚀 Зарегистрироваться', callback_data: 'start' }]);
    }

    const isAdmin = telegramId === process.env.ADMIN_TELEGRAM_ID;
    if (isAdmin) {
      keyboard.push([{ text: '🔄 Синхронизировать слоты', callback_data: 'admin_resync' }]);
    }

    await ctx.reply('📋 Меню', {
      reply_markup: { inline_keyboard: keyboard },
    });
    return;
  }

  async handleText(ctx: MyContext) {
    if (!ctx.session || !('text' in ctx.message!)) return;

    const step = ctx.session.step;
    const text = ctx.message.text.trim();

    if (!text || !step) return;

    switch (step) {
      case 'fullName':
        ctx.session.data.fullName = text;
        ctx.session.step = 'phone';
        await ctx.reply('Введите номер телефона:');
        return;

      case 'phone':
        ctx.session.data.phone = text;
        ctx.session.step = 'portfolio';
        await ctx.reply('Отправьте ссылку на портфолио:');
        return;

      case 'portfolio':
        ctx.session.data.portfolioUrl = text;
        ctx.session.step = 'slot';
        await this.askSlot(ctx);
        return;

      case 'confirm':
        if (text.toLowerCase() === 'да') {
          await this.confirmSession(ctx);
          return;
        } else {
          await ctx.reply('Отменено. Введите /start чтобы начать заново.');
          return;
        }

      default:
        await ctx.reply('Пожалуйста, следуйте инструкциям.');
        return;
    }
  }

  async handleSlot(ctx: MyContext) {
    if (!ctx.session) return;

    const slotId = ctx.match[1];
    const slot = await this.slotService.getSlotById(slotId);

    if (!slot) {
      await ctx.reply('❌ Слот не найден. Пожалуйста, выберите другой слот.');
      await this.askSlot(ctx);
      return;
    }

    ctx.session.step = 'confirm';
    ctx.session.data.selectedSlotId = slotId;

    const { fullName, phone, portfolioUrl } = ctx.session.data;

    const date = slot.date.toLocaleString('ru-RU');

    await ctx.reply(
      `Проверьте данные:\n\nФИО: ${fullName}\nТелефон: ${phone}\nПортфолио: ${portfolioUrl}\nДата: ${date}\n\nПодтвердить? (Да / Нет)`
    );
    return;
  }
}