import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { ProductType } from '../../../generated/prisma/enums';
import { BatchesService } from '../../batches/batches.service';
import { QrPdfService } from 'src/qr/qr-pdf.service';  
import { BubblegumService } from '../../solana/bubblegum/bubblegum.service';
import { TelegramAccountService } from '../services/telegram-account.service';
import { TelegramHarvestService } from '../services/telegram-harvest.service';

@Injectable()
export class HarvestFlowService {
  private readonly logger = new Logger(HarvestFlowService.name);

  constructor(
    private readonly accountService: TelegramAccountService,
    private readonly harvestService: TelegramHarvestService,
    private readonly batchesService: BatchesService,
    private readonly bubblegumService: BubblegumService,
    private readonly qrPdfService: QrPdfService,
  ) {}

  async createHarvestAndMint(input: {
    telegramUserId: string;
    farmId: string;
    productType: ProductType;
    quantity: number;
  }) {
    const producer = await this.accountService.findByTelegramId(
      input.telegramUserId,
    );

    if (!producer) {
      throw new BadRequestException('Produtor nao conectado ao Telegram');
    }

    const farm = await this.harvestService.getFarmIfOwned(
      input.farmId,
      producer.id,
    );

    if (!farm) {
      throw new BadRequestException('Fazenda nao pertence a este produtor');
    }

    const batch = await this.batchesService.create({
      productType: input.productType,
      farmId: farm.id,
      quantity: input.quantity,
      unit: this.harvestService.getUnit(input.productType),
    });

    const publicTraceUrl = this.harvestService.buildPublicBatchUrl(batch.code);

    let mintResult: Awaited<
      ReturnType<BubblegumService['mintBatchCnft']>
    > | null = null;
    let mintError: string | undefined;

    try {
      mintResult = await this.bubblegumService.mintBatchCnft(batch.id);
    } catch (error) {
      mintError =
        error instanceof Error ? error.message : 'Erro ao mintar cNFT';
      this.logger.warn(
        `cNFT mint falhou para o lote ${batch.code}: ${mintError}`,
      );
    }

    const qrPdf = await this.qrPdfService.generateBatchQrPdf({
      batchCode: batch.code,
      publicTraceUrl,
      evidenceHash: farm.lastValidationHash ?? undefined,
      cnftAddress: mintResult?.cnftAddress ?? undefined,
      mintTxHash: mintResult?.mintTxHash,
    });

    return {
      batchId: batch.id,
      batchCode: batch.code,
      publicTraceUrl,
      qrPdfUrl: qrPdf.publicUrl,
      mintTxHash: mintResult?.mintTxHash,
      cnftAddress: mintResult?.cnftAddress,
      mintError,
    };
  }
}
