import { Injectable, Logger } from '@nestjs/common';
import { Scenes, session, Telegraf } from 'telegraf';
import { BotContext, extractTelegramId } from './telegram.types';
import { LinkAccountScene } from './scenes/link-account.scene';
import { HarvestScene } from './scenes/harvest.scene';
import { TelegramAccountService } from './services/telegram-account.service';
import { GeminiService } from './gemini/gemini.service';
import { Msg } from './ui/telegram.messages';
import { CooperativesService } from '../cooperatives/cooperatives.service';

@Injectable()
export class TelegramRouter {
  private readonly logger = new Logger(TelegramRouter.name);

  constructor(
    private readonly linkAccountScene: LinkAccountScene,
    private readonly harvestScene: HarvestScene,
    private readonly accountService: TelegramAccountService,
    private readonly geminiService: GeminiService,
    private readonly cooperativesService: CooperativesService,
  ) {}

  register(bot: Telegraf<BotContext>): void {
    const stage = new Scenes.Stage<BotContext>([
      this.linkAccountScene.create(),
      this.harvestScene.create(),
    ]);

    bot.use(session());
    bot.use(stage.middleware());

    bot.start(async (ctx) => {
      const text = 'text' in ctx.message ? ctx.message.text : '';
      const payload = text.split(/\s+/)[1];

      await ctx.reply(Msg.welcome);

      if (payload?.startsWith('coop_')) {
        const inviteCode = payload.slice('coop_'.length);
        const cooperative =
          await this.cooperativesService.findByInviteCode(inviteCode);

        if (!cooperative) {
          await ctx.reply(Msg.cooperative.invalidLink);
          return;
        }

        await ctx.reply(Msg.cooperative.detected(cooperative.name));
        return ctx.scene.enter('linkAccount', {
          cooperativeInviteCode: inviteCode,
          cooperativeName: cooperative.name,
        });
      }

      return ctx.scene.enter('linkAccount');
    });

    bot.command('ajuda', (ctx) => ctx.reply(Msg.help));

    bot.command('linkar', (ctx) => ctx.scene.enter('linkAccount'));

    bot.command('cancelar', async (ctx) => {
      await ctx.scene.leave();
      await ctx.reply(Msg.cancelled);
    });

    bot.command(['colheita', 'colher'], async (ctx) => {
      const telegramUserId = extractTelegramId(ctx);
      if (!telegramUserId) {
        await ctx.reply(Msg.notLinked);
        return;
      }
      const producer =
        await this.accountService.findByTelegramId(telegramUserId);
      if (!producer) {
        await ctx.reply(Msg.notLinked);
        return;
      }
      return ctx.scene.enter('harvest');
    });

    // Mensagens de texto livre fora de qualquer cena vão para o Gemini
    bot.on('text', async (ctx) => {
      if (ctx.message.text.startsWith('/')) {
        await ctx.reply(Msg.unknownCommand);
        return;
      }

      const telegramUserId = extractTelegramId(ctx);
      if (!telegramUserId) {
        await ctx.reply(Msg.notLinked);
        return;
      }

      const producer =
        await this.accountService.findByTelegramId(telegramUserId);
      if (!producer) {
        await ctx.reply(Msg.gemini.notLinked);
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        await ctx.reply(Msg.gemini.notConfigured);
        return;
      }

      await ctx.sendChatAction('typing');

      try {
        const reply = await this.geminiService.chat(
          telegramUserId,
          producer.id,
          ctx.message.text,
        );
        await ctx.reply(reply);
      } catch (error) {
        this.logger.error('Erro na conversa com Gemini', error);
        await ctx.reply(Msg.gemini.error);
      }
    });

    bot.catch(async (error, ctx) => {
      this.logger.error('Erro no bot do Telegram', error);
      try {
        await ctx.reply(Msg.globalError);
      } catch (replyError) {
        this.logger.error(
          'Falha ao responder ao usuário após erro',
          replyError,
        );
      }
    });
  }
}
