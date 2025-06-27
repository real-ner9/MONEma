import {
  Ctx,
  Start,
  Update,
  Command,
  InjectBot,
  Hears,
  Action,
} from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { BookingService } from '../booking/booking.service';
import { MyContext } from '../types/my-context';
import { SlotService } from '../slot/slot.service';
import { UserService } from '../user/user.service';
import { SlotDocument } from '../slot/schemas/slot.schema';

@Update()
export class BotUpdate {
  constructor(
    private readonly bookingService: BookingService,
    private readonly slotService: SlotService,
    private readonly userService: UserService,
    @InjectBot() private readonly bot: Telegraf<MyContext>
  ) {}

  @Start()
  async onStart(@Ctx() ctx: MyContext) {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId || !ctx.session) return;

    const existingUser = await this.userService.findByTelegramId(telegramId);
    if (existingUser) {
      return ctx.reply('Вы уже зарегистрированы. Напишите /profile для просмотра.');
    }

    ctx.session.step = 'fullName';
    ctx.session.data = { telegramId, username: ctx.from?.username || '' };

    await ctx.reply('Добро пожаловать! Введите ваше ФИО:');
  }

  @Hears(/.*/)
  async handleText(@Ctx() ctx: MyContext) {
    if (!ctx.session || !('text' in ctx.message!)) {
      return;
    }

    const step = ctx.session.step;
    const text = ctx.message.text.trim();

    if (!text || !step) return;

    switch (step) {
      case 'fullName':
        ctx.session.data.fullName = text;
        ctx.session.step = 'phone';
        await ctx.reply('Введите номер телефона:');
        break;

      case 'phone':
        ctx.session.data.phone = text;
        ctx.session.step = 'portfolio';
        await ctx.reply('Отправьте ссылку на портфолио:');
        break;

      case 'portfolio':
        ctx.session.data.portfolioUrl = text;
        ctx.session.step = 'slot';
        await this.askSlot(ctx);
        break;

      case 'confirm':
        if (text.toLowerCase() === 'да') {
          await this.saveUser(ctx);
        } else {
          await ctx.reply('Отменено. Введите /start чтобы начать заново.');
        }
        break;

      default:
        await ctx.reply('Пожалуйста, следуйте инструкциям.');
        break;
    }
  }

  private async askSlot(ctx: MyContext) {
    const keyboard = await this.slotService.getSlotKeyboard();
    return ctx.reply('Выберите слот:', keyboard);
  }

  @Action(/slot_(.+)/)
  async handleSlot(@Ctx() ctx: MyContext) {
    if (!ctx.session) return;
    const slotId = ctx.match[1];
    ctx.session.data.selectedSlot = slotId;
    ctx.session.step = 'confirm';

    const data = ctx.session.data;
    const slot = await this.slotService.getSlotById(slotId);

    await ctx.reply(
      `Проверьте данные:\n\nФИО: ${data.fullName}\nТелефон: ${data.phone}\nПортфолио: ${data.portfolioUrl}\nДата: ${slot?.date.toLocaleString('ru-RU')}\n\nПодтвердить? (Да / Нет)`
    );
  }

  private async saveUser(ctx: MyContext) {
    if (!ctx.session) return;
    const data = ctx.session.data;
    const user = await this.userService.createUser({
      telegramId: data.telegramId,
      username: data.username,
      fullName: data.fullName,
      phone: data.phone,
      portfolioUrl: data.portfolioUrl,
      selectedSlot: data.selectedSlot,
    });

    await this.bookingService.createBooking(user.telegramId, user.selectedSlot as string);
    ctx.session = null;

    return ctx.reply('✅ Спасибо! Вы успешно записаны на кастинг.');
  }

  @Command('profile')
  async showProfile(@Ctx() ctx: MyContext) {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return ctx.reply('Не удалось получить Telegram ID');

    const user = await this.userService.findByTelegramId(telegramId)
      .populate<{ selectedSlot: SlotDocument }>('selectedSlot');

    if (!user) {
      return ctx.reply('Вы ещё не зарегистрированы. Напишите /start.');
    }

    const date = user.selectedSlot?.date
      ? user.selectedSlot.date.toLocaleString('ru-RU')
      : 'не указана';

    return ctx.reply(
      `👤 Профиль:\n\nФИО: ${user.fullName}\nТелефон: ${user.phone}\nПортфолио: ${user.portfolioUrl}\nДата: ${date}`
    );
  }
}
