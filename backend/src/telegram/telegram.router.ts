import { Injectable, Logger } from '@nestjs/common';
import { Scenes, session, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { BotContext, extractTelegramId } from './telegram.types';
import { LinkAccountScene } from './scenes/link-account.scene';
import { HarvestScene } from './scenes/harvest.scene';
import { RegisterFarmScene } from './scenes/register-farm.scene';
import { DocumentUploadScene } from './scenes/document-upload.scene';
import { AddStageScene } from './scenes/add-stage.scene';
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
    private readonly registerFarmScene: RegisterFarmScene,
    private readonly documentUploadScene: DocumentUploadScene,
    private readonly addStageScene: AddStageScene,
    private readonly accountService: TelegramAccountService,
    private readonly geminiService: GeminiService,
    private readonly cooperativesService: CooperativesService,
  ) {}

  register(bot: Telegraf<BotContext>): void {
    const stage = new Scenes.Stage<BotContext>([
      this.linkAccountScene.create(),
      this.harvestScene.create(),
      this.registerFarmScene.create(),
      this.documentUploadScene.create(),
      this.addStageScene.create(),
    ]);

    bot.use(session());
    bot.use(stage.middleware());

    bot.start(async (ctx) => {
      const text = 'text' in ctx.message ? ctx.message.text : '';
      const payload = text.split(/\s+/)[1];
      const telegramUserId = extractTelegramId(ctx);

      await ctx.reply(Msg.welcome);

      if (telegramUserId) {
        const linkedProducer = await this.accountService.findByTelegramId(telegramUserId);
        if (linkedProducer) {
          await ctx.reply(Msg.alreadyLinkedStart(linkedProducer.name));
          return;
        }
      }

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

    bot.command(['fazenda', 'car'], async (ctx) => {
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
      return ctx.scene.enter('registerFarm');
    });

    bot.command(['documento', 'doc'], async (ctx) => {
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
      return ctx.scene.enter('documentUpload');
    });

    bot.command(['etapa', 'stage'], async (ctx) => {
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
      return ctx.scene.enter('addStage');
    });

    bot.on(message('document'), async (ctx) => {
      if (ctx.scene.current?.id) {
        return;
      }

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

      return ctx.scene.enter('documentUpload');
    });

    bot.on(message('photo'), async (ctx) => {
      if (ctx.scene.current?.id) {
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
        await ctx.reply(Msg.notLinked);
        return;
      }

      return ctx.scene.enter('registerFarm');
    });

    // Mensagens de texto livre fora de qualquer scene vao para o Gemini.
    bot.on('text', async (ctx) => {
      if (ctx.scene.current?.id) {
        return;
      }

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
          'Falha ao responder ao usuario apos erro',
          replyError,
        );
      }
    });
  }
}
