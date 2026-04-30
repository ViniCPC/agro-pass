import { Injectable, Logger } from '@nestjs/common';
import { Scenes, session, Telegraf } from 'telegraf';
import { BotContext, extractCallbackData, extractTelegramId } from './telegram.types';
import { LinkAccountScene } from './scenes/link-account.scene';
import { HarvestScene } from './scenes/harvest.scene';
import { TelegramAccountService } from './services/telegram-account.service';
import { TelegramHarvestService } from './services/telegram-harvest.service';
import { Msg } from './ui/telegram.messages';
import { buildQrKeyboard } from './ui/telegram.keyboards';

@Injectable()
export class TelegramRouter {
  private readonly logger = new Logger(TelegramRouter.name);

  constructor(
    private readonly linkAccountScene: LinkAccountScene,
    private readonly harvestScene: HarvestScene,
    private readonly accountService: TelegramAccountService,
    private readonly harvestService: TelegramHarvestService,
  ) {}

  register(bot: Telegraf<BotContext>): void {
    const stage = new Scenes.Stage<BotContext>([
      this.linkAccountScene.create(),
      this.harvestScene.create(),
    ]);

    bot.use(session());
    bot.use(stage.middleware());

    bot.start(async (ctx) => {
      await ctx.reply(Msg.welcome);
      return ctx.scene.enter('linkAccount');
    });

    bot.command('ajuda', (ctx) => ctx.reply(Msg.help));

    bot.command('linkar', (ctx) => ctx.scene.enter('linkAccount'));

    bot.command('cancelar', async (ctx) => {
      await ctx.scene.leave();
      await ctx.reply(Msg.cancelled);
    });

    bot.command('colheita', async (ctx) => {
      const telegramUserId = extractTelegramId(ctx);
      if (!telegramUserId) {
        await ctx.reply(Msg.notLinked);
        return;
      }
      const producer = await this.accountService.findByTelegramId(telegramUserId);
      if (!producer) {
        await ctx.reply(Msg.notLinked);
        return;
      }
      return ctx.scene.enter('harvest');
    });

    bot.action(/^qr:/, async (ctx) => {
      await ctx.answerCbQuery();

      const callbackData = extractCallbackData(ctx);
      const token = callbackData?.slice(3).trim();

      if (!token) {
        await ctx.reply(Msg.qrNotFound);
        return;
      }

      let publicBatchUrl: string | null = null;

      if (this.isUuid(token)) {
        publicBatchUrl = await this.harvestService.buildPublicBatchUrlById(token);
      } else {
        publicBatchUrl = this.harvestService.buildPublicBatchUrl(token);
      }

      if (!publicBatchUrl) {
        await ctx.reply(Msg.qrNotFound);
        return;
      }

      await ctx.reply(Msg.qrReady(publicBatchUrl), buildQrKeyboard(publicBatchUrl));
    });

    bot.catch(async (error, ctx) => {
      this.logger.error('Erro no bot do Telegram', error);
      try {
        await ctx.reply(Msg.globalError);
      } catch (replyError) {
        this.logger.error('Falha ao responder ao usuário após erro', replyError);
      }
    });
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
