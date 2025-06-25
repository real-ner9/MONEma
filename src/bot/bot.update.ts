import { Ctx, Start, Update, Command, InjectBot, Message, Action, Hears } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { BookingService } from '../booking/booking.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Slot, SlotDocument } from '../slot/schemas/slot.schema';

@Update()
export class BotUpdate {
  constructor(
    private readonly bookingService: BookingService,
    @InjectBot() private readonly bot: Telegraf<Context>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Slot.name) private slotModel: Model<SlotDocument>,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Ошибка: не удалось получить информацию о пользователе');
      return;
    }

    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username;

    let user = await this.userModel.findOne({ telegramId });
    if (!user) {
      user = await this.userModel.create({
        telegramId,
        username,
        agreedToPolicy: false,
      });
    }

    await ctx.reply(
      `Привет! Чтобы продолжить, подтвердите согласие с политикой конфиденциальности`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: '✅ Согласен', callback_data: 'agree_policy' }]],
        },
      },
    );
  }

  @Command('slots')
  async showSlots(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;

    const user = await this.userModel.findOne({ telegramId });

    if (!user?.agreedToPolicy) {
      await ctx.reply('Пожалуйста, сначала подтвердите согласие с политикой конфиденциальности');
      return;
    }

    const slots = await this.slotModel.find({}).sort({ date: 1 });

    const keyboard = slots.map((slot) => [
      {
        text: `${slot.date.toLocaleString('ru-RU')} (осталось ${slot.maxBookings - slot.bookedCount})`,
        callback_data: `book_slot_${slot._id}`,
      },
    ]);

    await ctx.reply('Выберите удобный слот:', {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }

  @Hears('Номер телефона')
  async handlePhone(@Ctx() ctx: Context) {
    // сюда можно добавить реакцию на контакт, если надо
  }

  @Command('cancel')
  async cancel(@Ctx() ctx: Context) {
    await ctx.reply('Функция отмены в разработке');
  }

  @Command('policy')
  async policy(@Ctx() ctx: Context) {
    await ctx.reply('📄 Политика: https://example.com/privacy');
  }

  @Action(/.*/)
  async handleCallback(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Ошибка: не удалось получить информацию о пользователе');
      return;
    }

    const callbackData = 'data' in ctx.callbackQuery! ? ctx.callbackQuery!.data : undefined;
    if (!callbackData) return;

    const telegramId = ctx.from.id.toString();

    if (callbackData === 'agree_policy') {
      await this.userModel.findOneAndUpdate({ telegramId }, { agreedToPolicy: true });
      await ctx.reply('✅ Спасибо! Теперь вы можете записаться. Напишите /slots');
      return;
    }

    if (callbackData?.startsWith('book_slot_')) {
      const slotId = callbackData.replace('book_slot_', '');
      try {
        await this.bookingService.createBooking(telegramId, slotId);
        await ctx.reply('Вы успешно записаны! ✅');
      } catch (e) {
        await ctx.reply(`Ошибка: ${e.message}`);
      }
    }
  }
}
