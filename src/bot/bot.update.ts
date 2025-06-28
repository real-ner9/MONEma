import { Action, Command, Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { MyContext } from '../types/my-context';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async onStart(@Ctx() ctx: MyContext) {
    return this.botService.handleStart(ctx);
  }

  @Command('menu')
  async showMenu(@Ctx() ctx: MyContext) {
    return this.botService.handleMenu(ctx);
  }

  @Command('sync')
  async handleSync(@Ctx() ctx: MyContext) {
    return this.botService.handleSyncCommand(ctx);
  }

  @Hears(/.*/)
  async handleText(@Ctx() ctx: MyContext) {
    return this.botService.handleText(ctx);
  }

  @Action(/slot_(.+)/)
  async handleSlot(@Ctx() ctx: MyContext) {
    return this.botService.handleSlot(ctx);
  }

  @Action('profile')
  async profileFromMenu(@Ctx() ctx: MyContext) {
    return this.botService.handleProfile(ctx);
  }

  @Action('start')
  async startFromMenu(@Ctx() ctx: MyContext) {
    return this.botService.handleStart(ctx);
  }

  @Action('admin_resync')
  async resyncFromMenu(@Ctx() ctx: MyContext) {
    return this.botService.handleSyncCommand(ctx);
  }
}
