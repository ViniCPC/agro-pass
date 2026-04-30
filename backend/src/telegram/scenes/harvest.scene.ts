import { Injectable, Logger } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { ProductType } from '../../../generated/prisma/enums';
import {
  BotContext,
  extractCallbackData,
  extractTelegramId,
  extractText,
  wizardState,
} from '../telegram.types';
import { TelegramAccountService } from '../services/telegram-account.service';
import { TelegramHarvestService } from '../services/telegram-harvest.service';
import { Msg } from '../ui/telegram.messages';
import {
  PRODUCT_KEYBOARD,
  CONFIRM_KEYBOARD,
  buildFarmKeyboard,
  buildQrKeyboard,
} from '../ui/telegram.keyboards';

@Injectable()
export class HarvestScene {
  private readonly logger = new Logger(HarvestScene.name);

  constructor(
    private readonly accountService: TelegramAccountService,
    private readonly harvestService: TelegramHarvestService,
  ) {}

  create(): Scenes.WizardScene<BotContext> {
    const scene = new Scenes.WizardScene<BotContext>(
      'harvest',

      // Passo 0: escolher cultura
      async (ctx) => {
        await ctx.reply(Msg.harvest.askProduct, PRODUCT_KEYBOARD);
        return ctx.wizard.next();
      },

      // Passo 1: receber cultura, exibir seleção de fazenda
      async (ctx) => {
        const data = extractCallbackData(ctx);
        if (!data?.startsWith('product:')) {
          await ctx.reply(Msg.harvest.chooseProductButton);
          return;
        }

        const rawProduct = data.replace('product:', '');
        if (!(Object.values(ProductType) as string[]).includes(rawProduct)) {
          await ctx.reply(Msg.harvest.chooseProductButton);
          return;
        }
        const productType = rawProduct as ProductType;

        wizardState(ctx).productType = productType;
        await ctx.answerCbQuery();

        const telegramUserId = extractTelegramId(ctx);
        if (!telegramUserId) {
          await ctx.reply(Msg.notLinked);
          return ctx.scene.leave();
        }

        const producer = await this.accountService.findByTelegramId(telegramUserId);
        if (!producer) {
          await ctx.reply(Msg.notLinked);
          return ctx.scene.leave();
        }

        wizardState(ctx).producerId = producer.id;

        const farms = await this.harvestService.getFarmsForProducer(producer.id);
        if (farms.length === 0) {
          await ctx.reply(Msg.harvest.noFarms);
          return ctx.scene.leave();
        }

        await ctx.reply(Msg.harvest.selectFarm, buildFarmKeyboard(farms));
        return ctx.wizard.next();
      },

      // Passo 2: receber fazenda, pedir quantidade
      async (ctx) => {
        const data = extractCallbackData(ctx);
        if (!data?.startsWith('farm:')) {
          await ctx.reply(Msg.harvest.chooseFarmButton);
          return;
        }

        const farmId = data.replace('farm:', '');
        const producerId = wizardState(ctx).producerId!;

        const farm = await this.harvestService.getFarmIfOwned(farmId, producerId);
        if (!farm) {
          await ctx.reply(Msg.harvest.farmNotOwned);
          return ctx.scene.leave();
        }

        wizardState(ctx).farmId = farm.id;
        wizardState(ctx).farmName = farm.name;
        await ctx.answerCbQuery();

        const productType = wizardState(ctx).productType!;
        await ctx.reply(Msg.harvest.askQuantity(this.harvestService.getUnit(productType)));
        return ctx.wizard.next();
      },

      // Passo 3: receber quantidade, exibir confirmação
      async (ctx) => {
        const text = extractText(ctx);
        const quantity = Number(text);

        if (!text || Number.isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
          await ctx.reply(Msg.harvest.invalidQuantity);
          return;
        }

        wizardState(ctx).quantity = quantity;

        const productType = wizardState(ctx).productType!;
        const farmName = wizardState(ctx).farmName ?? 'não encontrada';

        await ctx.reply(
          Msg.harvest.confirmPrompt(productType, farmName, quantity),
          CONFIRM_KEYBOARD,
        );
        return ctx.wizard.next();
      },

      // Passo 4: criar lote
      async (ctx) => {
        const data = extractCallbackData(ctx);

        if (data === 'confirm:no') {
          await ctx.answerCbQuery();
          await ctx.reply(Msg.harvest.cancelledHarvest);
          return ctx.scene.leave();
        }

        if (data !== 'confirm:yes') {
          await ctx.reply(Msg.harvest.confirmButton);
          return;
        }

        await ctx.answerCbQuery();

        const productType = wizardState(ctx).productType;
        const farmId = wizardState(ctx).farmId;
        const quantity = wizardState(ctx).quantity;

        if (!productType || !farmId || !quantity) {
          await ctx.reply(Msg.harvest.incomplete);
          return ctx.scene.leave();
        }

        try {
          const batch = await this.harvestService.createBatch({ productType, farmId, quantity });
          const publicBatchUrl = this.harvestService.buildPublicBatchUrl(batch.code);
          await ctx.reply(
            Msg.harvest.success(batch.code, productType, batch.quantity),
            buildQrKeyboard(publicBatchUrl),
          );
        } catch (error) {
          this.logger.error('Erro ao criar lote pelo Telegram', error);
          await ctx.reply(Msg.harvest.error);
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
