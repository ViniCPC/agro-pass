import { Injectable, Logger } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { BotContext, extractTelegramId, extractText } from '../telegram.types';
import { TelegramAccountService } from '../services/telegram-account.service';
import { Msg } from '../ui/telegram.messages';

@Injectable()
export class LinkAccountScene {
  private readonly logger = new Logger(LinkAccountScene.name);

  constructor(private readonly accountService: TelegramAccountService) {}

  create(): Scenes.WizardScene<BotContext> {
    const scene = new Scenes.WizardScene<BotContext>(
      'linkAccount',

      // Passo 0: solicitar telefone
      async (ctx) => {
        await ctx.reply(Msg.link.askPhone);
        return ctx.wizard.next();
      },

      // Passo 1: receber telefone e vincular
      async (ctx) => {
        const telegramUserId = extractTelegramId(ctx);
        if (!telegramUserId) {
          await ctx.reply(Msg.link.noFromId);
          return ctx.scene.leave();
        }

        const text = extractText(ctx);
        if (!text) {
          await ctx.reply(Msg.link.notText);
          return;
        }

        const phone = this.accountService.normalizePhone(text);
        if (!this.accountService.isValidPhoneLength(phone)) {
          await ctx.reply(Msg.link.invalidFormat);
          return;
        }

        try {
          const result = await this.accountService.linkAccount(telegramUserId, phone);

          switch (result.status) {
            case 'success':
              await ctx.reply(Msg.link.success(result.producerName));
              break;
            case 'already_linked':
              await ctx.reply(Msg.link.alreadyLinked(result.producerName));
              break;
            case 'not_found':
              await ctx.reply(Msg.link.notFound);
              break;
            case 'ambiguous':
              await ctx.reply(Msg.link.ambiguous);
              break;
            case 'phone_conflict':
              await ctx.reply(Msg.link.phoneConflict);
              break;
            case 'telegram_conflict':
              await ctx.reply(Msg.link.telegramConflict(result.existingProducerName));
              break;
          }
        } catch (error) {
          this.logger.error('Erro ao vincular conta Telegram', error);
          await ctx.reply(Msg.link.error);
        }

        return ctx.scene.leave();
      },
    );

    scene.command('cancelar', async (ctx) => {
      await ctx.scene.leave();
      await ctx.reply(Msg.cancelled);
    });

    return scene;
  }
}
