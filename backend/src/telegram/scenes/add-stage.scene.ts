import { Injectable, Logger } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { DocumentType, TraceEventType } from '../../../generated/prisma/enums';
import { TraceEventsService } from '../../trace-events/trace-events.service';
import {
  BotContext,
  extractCallbackData,
  extractTelegramId,
  extractText,
  wizardState,
} from '../telegram.types';
import { TelegramAccountService } from '../services/telegram-account.service';
import { TelegramDocumentService } from '../services/telegram-document.service';
import { Msg } from '../ui/telegram.messages';
import {
  STAGE_ADD_MORE_KEYBOARD,
  STAGE_SKIP_DOCUMENT_KEYBOARD,
  buildBatchKeyboard,
} from '../ui/telegram.keyboards';

@Injectable()
export class AddStageScene {
  private readonly logger = new Logger(AddStageScene.name);

  constructor(
    private readonly accountService: TelegramAccountService,
    private readonly documentService: TelegramDocumentService,
    private readonly traceEventsService: TraceEventsService,
  ) {}

  create(): Scenes.WizardScene<BotContext> {
    const scene = new Scenes.WizardScene<BotContext>(
      'addStage',

      // Step 0: identify producer and either preselect batch or ask user to choose.
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
        wizardState(ctx).producerName = producer.name;

        const sceneState = (ctx.scene.state ?? {}) as {
          batchId?: string;
          batchCode?: string;
        };
        const preselectedBatchId = wizardState(ctx).batchId ?? sceneState.batchId;

        if (preselectedBatchId) {
          const batch = await this.documentService.getBatchIfOwned(
            preselectedBatchId,
            producer.id,
          );

          if (!batch) {
            await ctx.reply(Msg.stage.batchNotFound);
            return ctx.scene.leave();
          }

          wizardState(ctx).batchId = batch.id;
          wizardState(ctx).batchCode = batch.code;

          await ctx.reply(Msg.stage.readyForBatch(batch.code));
          await ctx.reply(Msg.stage.askName);
          ctx.wizard.selectStep(2);
          return;
        }

        const batches = await this.documentService.getRecentBatchesForProducer(
          producer.id,
        );
        if (batches.length === 0) {
          await ctx.reply(Msg.stage.noBatches);
          return ctx.scene.leave();
        }

        await ctx.reply(Msg.stage.selectBatch, buildBatchKeyboard(batches));
        return ctx.wizard.next();
      },

      // Step 1: receive selected batch.
      async (ctx) => {
        const data = extractCallbackData(ctx);
        if (!data?.startsWith('batch:')) {
          await ctx.reply(Msg.stage.chooseBatchButton);
          return;
        }

        const batchId = data.replace('batch:', '');
        const producerId = wizardState(ctx).producerId!;
        const batch = await this.documentService.getBatchIfOwned(batchId, producerId);
        if (!batch) {
          await ctx.reply(Msg.stage.batchNotFound);
          return ctx.scene.leave();
        }

        wizardState(ctx).batchId = batch.id;
        wizardState(ctx).batchCode = batch.code;
        await ctx.answerCbQuery();

        await ctx.reply(Msg.stage.readyForBatch(batch.code));
        await ctx.reply(Msg.stage.askName);
        return ctx.wizard.next();
      },

      // Step 2: free stage name.
      async (ctx) => {
        const name = extractText(ctx)?.trim() ?? '';
        if (name.length < 3 || name.length > 140) {
          await ctx.reply(Msg.stage.invalidName);
          return;
        }

        wizardState(ctx).stageName = name;

        const timestampLabel = new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour12: false,
        });

        await ctx.reply(
          Msg.stage.askDocument(timestampLabel),
          STAGE_SKIP_DOCUMENT_KEYBOARD,
        );
        return ctx.wizard.next();
      },

      // Step 3: receive document/photo or skip, then create trace event.
      async (ctx) => {
        const batchId = wizardState(ctx).batchId;
        const stageName = wizardState(ctx).stageName;
        const actorName = wizardState(ctx).producerName ?? 'Produtor';
        if (!batchId || !stageName) {
          await ctx.reply(Msg.stage.error);
          return ctx.scene.leave();
        }

        const callbackData = extractCallbackData(ctx);
        const text = extractText(ctx);
        const shouldSkipDocument =
          callbackData === 'stage:skip_document' || text === '/pular';

        let documentId: string | undefined;

        if (!shouldSkipDocument) {
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          if (!botToken) {
            await ctx.reply(Msg.stage.error);
            return ctx.scene.leave();
          }

          const message = ctx.message as Record<string, unknown> | undefined;
          if (!message) {
            await ctx.reply(Msg.stage.sendFileAgain);
            return;
          }

          let fileId: string | null = null;
          let mimeType = 'image/jpeg';

          if (Array.isArray(message.photo) && message.photo.length > 0) {
            const photos = message.photo as Array<{ file_id: string }>;
            fileId = photos[photos.length - 1].file_id;
            mimeType = 'image/jpeg';
          } else if (message.document && typeof message.document === 'object') {
            const document = message.document as { file_id: string; mime_type?: string };
            fileId = document.file_id;
            mimeType = document.mime_type ?? 'application/octet-stream';
          }

          if (!fileId) {
            await ctx.reply(Msg.stage.sendFileAgain);
            return;
          }

          const telegramFile = await ctx.telegram.getFile(fileId);
          if (!telegramFile.file_path) {
            await ctx.reply(Msg.stage.documentWarning);
          } else {
            try {
              const savedDocument = await this.documentService.downloadAndSave({
                botToken,
                telegramFilePath: telegramFile.file_path,
                mimeType,
                batchId,
                documentType: DocumentType.OTHER,
              });
              documentId = savedDocument.documentId;
            } catch (docError) {
              this.logger.warn('Falha ao salvar comprovante da etapa, continuando sem documento', docError);
              await ctx.reply(Msg.stage.documentWarning);
            }
          }
        } else if (callbackData) {
          await ctx.answerCbQuery();
        }

        await ctx.reply(Msg.stage.saving);

        try {
          await this.traceEventsService.create(batchId, {
            type: TraceEventType.PROCESSED,
            actorName,
            customStageName: stageName,
            documentId,
          });
        } catch (error) {
          this.logger.error('Erro ao criar trace event de etapa adicional', error);
          await ctx.reply(Msg.stage.error);
          return ctx.scene.leave();
        }

        if (documentId) {
          await ctx.reply(Msg.stage.successWithDocument(stageName));
        } else {
          await ctx.reply(Msg.stage.success(stageName));
        }

        await ctx.reply(Msg.stage.askAddAnother, STAGE_ADD_MORE_KEYBOARD);
        return ctx.wizard.next();
      },

      // Step 4: add another stage or finish.
      async (ctx) => {
        const data = extractCallbackData(ctx);
        if (data === 'stage:add_more:yes') {
          await ctx.answerCbQuery();
          wizardState(ctx).stageName = undefined;
          await ctx.reply(Msg.stage.askName);
          ctx.wizard.selectStep(2);
          return;
        }

        if (data === 'stage:add_more:no') {
          await ctx.answerCbQuery();
          await ctx.reply(Msg.stage.done);
          return ctx.scene.leave();
        }

        await ctx.reply(Msg.stage.chooseAddAnotherButton);
      },
    );

    scene.command('cancelar', async (ctx) => {
      await ctx.scene.leave();
      await ctx.reply(Msg.cancelled);
    });

    return scene;
  }
}
