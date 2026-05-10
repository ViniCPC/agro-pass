import { Injectable, Logger } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { DocumentType } from '../../../generated/prisma/enums';
import {
  BotContext,
  extractCallbackData,
  extractTelegramId,
  wizardState,
} from '../telegram.types';
import { TelegramAccountService } from '../services/telegram-account.service';
import { TelegramDocumentService } from '../services/telegram-document.service';
import { Msg } from '../ui/telegram.messages';
import { DOCUMENT_TYPE_KEYBOARD, buildBatchKeyboard } from '../ui/telegram.keyboards';

@Injectable()
export class DocumentUploadScene {
  private readonly logger = new Logger(DocumentUploadScene.name);

  constructor(
    private readonly accountService: TelegramAccountService,
    private readonly documentService: TelegramDocumentService,
  ) {}

  create(): Scenes.WizardScene<BotContext> {
    const scene = new Scenes.WizardScene<BotContext>(
      'documentUpload',

      // Passo 0: listar lotes recentes
      async (ctx) => {
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

        const batches = await this.documentService.getRecentBatchesForProducer(producer.id);
        if (batches.length === 0) {
          await ctx.reply(Msg.document.noBatches);
          return ctx.scene.leave();
        }

        await ctx.reply(Msg.document.selectBatch, buildBatchKeyboard(batches));
        return ctx.wizard.next();
      },

      // Passo 1: receber lote, mostrar tipos de documento
      async (ctx) => {
        const data = extractCallbackData(ctx);
        if (!data?.startsWith('batch:')) {
          await ctx.reply(Msg.document.chooseBatchButton);
          return;
        }

        const batchId = data.replace('batch:', '');
        const producerId = wizardState(ctx).producerId!;

        const batch = await this.documentService.getBatchIfOwned(batchId, producerId);
        if (!batch) {
          await ctx.reply(Msg.document.batchNotFound);
          return ctx.scene.leave();
        }

        wizardState(ctx).batchId = batch.id;
        wizardState(ctx).batchCode = batch.code;
        await ctx.answerCbQuery();

        await ctx.reply(Msg.document.selectType, DOCUMENT_TYPE_KEYBOARD);
        return ctx.wizard.next();
      },

      // Passo 2: receber tipo, pedir arquivo
      async (ctx) => {
        const data = extractCallbackData(ctx);
        if (!data?.startsWith('doctype:')) {
          await ctx.reply(Msg.document.chooseTypeButton);
          return;
        }

        const rawType = data.replace('doctype:', '');
        if (!(Object.values(DocumentType) as string[]).includes(rawType)) {
          await ctx.reply(Msg.document.chooseTypeButton);
          return;
        }

        wizardState(ctx).documentType = rawType as DocumentType;
        await ctx.answerCbQuery();

        await ctx.reply(Msg.document.sendFile);
        return ctx.wizard.next();
      },

      // Passo 3: receber arquivo (foto ou documento)
      async (ctx) => {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          await ctx.reply(Msg.document.error);
          return ctx.scene.leave();
        }

        const msg = ctx.message as Record<string, unknown> | undefined;
        if (!msg) {
          await ctx.reply(Msg.document.sendFileAgain);
          return;
        }

        let fileId: string | null = null;
        let mimeType = 'image/jpeg';

        if (Array.isArray(msg['photo']) && (msg['photo'] as unknown[]).length > 0) {
          const photos = msg['photo'] as Array<{ file_id: string }>;
          fileId = photos[photos.length - 1].file_id;
          mimeType = 'image/jpeg';
        } else if (msg['document'] && typeof msg['document'] === 'object') {
          const doc = msg['document'] as { file_id: string; mime_type?: string };
          fileId = doc.file_id;
          mimeType = doc.mime_type ?? 'application/octet-stream';
        }

        if (!fileId) {
          await ctx.reply(Msg.document.sendFileAgain);
          return;
        }

        await ctx.reply(Msg.document.saving);

        try {
          const tgFile = await ctx.telegram.getFile(fileId);
          if (!tgFile.file_path) {
            throw new Error('Telegram não retornou caminho do arquivo.');
          }

          await this.documentService.downloadAndSave({
            botToken,
            telegramFilePath: tgFile.file_path,
            mimeType,
            batchId: wizardState(ctx).batchId!,
            documentType: wizardState(ctx).documentType!,
          });

          await ctx.reply(Msg.document.success(wizardState(ctx).batchCode!));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro desconhecido';
          this.logger.error('Erro ao salvar documento via Telegram', err);
          await ctx.reply(Msg.document.saveError(message));
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
