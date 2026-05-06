import { Injectable } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { BotContext, extractCallbackData } from '../telegram.types';
import { TelegramFarmService } from '../services/telegram-farm.service';
import { Msg } from '../ui/telegram.messages';

@Injectable()
export class RegisterFarmScene {
  constructor(private readonly farmService: TelegramFarmService) {}

  create(): Scenes.WizardScene<BotContext> {
    const scene = new Scenes.WizardScene<BotContext>(
      'registerFarm',

      // Passo 0: solicitar foto do CAR ou processar a foto atual.
      async (ctx) => {
        if (ctx.message && 'photo' in ctx.message) {
          await this.farmService.handleCarPhoto(ctx);
        } else {
          await ctx.reply(Msg.farmRegistration.askCarPhoto);
        }
        return ctx.wizard.next();
      },

      // Passo 1: receber confirmacao, nova foto, ou manter aguardando.
      async (ctx) => {
        const data = extractCallbackData(ctx);
        if (data === 'farm_confirm_car_data') {
          await ctx.answerCbQuery();
          const confirmed = await this.farmService.handleConfirmCarData(ctx);
          if (confirmed) {
            return ctx.scene.leave();
          }
          return;
        }

        if (data === 'farm_manual_input') {
          await ctx.answerCbQuery();
          await ctx.reply(Msg.farmRegistration.manualInputPending);
          return;
        }

        if (data === 'farm_send_another_car_photo') {
          await ctx.answerCbQuery();
          await ctx.reply(Msg.farmRegistration.askCarPhoto);
          return;
        }

        if (ctx.message && 'photo' in ctx.message) {
          await this.farmService.handleCarPhoto(ctx);
          return;
        }

        await ctx.reply(Msg.farmRegistration.askCarPhoto);
      },
    );

    scene.command('cancelar', async (ctx) => {
      await ctx.scene.leave();
      await ctx.reply(Msg.cancelled);
    });

    return scene;
  }
}
