import { Injectable, Logger } from '@nestjs/common';
import { Scenes } from 'telegraf';
import {
  BotContext,
  extractTelegramId,
  extractText,
  wizardState,
} from '../telegram.types';
import { TelegramAccountService } from '../services/telegram-account.service';
import { Msg } from '../ui/telegram.messages';

@Injectable()
export class LinkAccountScene {
  private readonly logger = new Logger(LinkAccountScene.name);

  constructor(private readonly accountService: TelegramAccountService) {}

  create(): Scenes.WizardScene<BotContext> {
    const scene = new Scenes.WizardScene<BotContext>(
      'linkAccount',

      // Passo 0: solicitar telefone ou CPF/CNPJ quando veio de deep link.
      async (ctx) => {
        if (wizardState(ctx).cooperativeInviteCode) {
          await ctx.reply(Msg.cooperative.askDocument);
          return ctx.wizard.next();
        }

        await ctx.reply(Msg.link.askPhone);
        return ctx.wizard.next();
      },

      // Passo 1: receber telefone ou documento e vincular
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

        const state = wizardState(ctx);
        if (state.cooperativeInviteCode) {
          const document = this.accountService.normalizeDocument(text);

          if (!this.accountService.isValidDocumentLength(document)) {
            await ctx.reply(Msg.cooperative.invalidDocument);
            return;
          }

          try {
            const result = await this.accountService.linkProducerByDocument({
              telegramUserId,
              document,
              cooperativeInviteCode: state.cooperativeInviteCode,
            });

            switch (result.status) {
              case 'success':
              case 'already_linked':
                await ctx.reply(Msg.cooperative.producerLinked(result.producerName));
                break;
              case 'invalid_document':
                await ctx.reply(Msg.cooperative.invalidDocument);
                break;
              case 'not_found':
                await ctx.reply(Msg.cooperative.producerNotFound);
                break;
              case 'document_conflict':
                await ctx.reply(Msg.cooperative.alreadyLinked);
                break;
              case 'telegram_conflict':
                await ctx.reply(Msg.link.telegramConflict(result.existingProducerName));
                break;
            }
          } catch (error) {
            this.logger.error('Erro ao vincular conta Telegram por documento', error);
            await ctx.reply(Msg.link.error);
          }

          return ctx.scene.leave();
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
