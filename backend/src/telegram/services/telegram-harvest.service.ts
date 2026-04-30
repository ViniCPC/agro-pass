import { Injectable, Logger } from '@nestjs/common';
import { ProductType } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchesService } from '../../batches/batches.service';
import { UNIT_BY_PRODUCT } from '../ui/telegram.messages';

@Injectable()
export class TelegramHarvestService {
  private readonly logger = new Logger(TelegramHarvestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly batchesService: BatchesService,
  ) {}

  async getFarmsForProducer(producerId: string) {
    return this.prisma.farm.findMany({
      where: { producerId },
      orderBy: { name: 'asc' },
    });
  }

  async getFarmName(farmId: string): Promise<string | null> {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: { name: true },
    });
    return farm?.name ?? null;
  }

  async getFarmIfOwned(
    farmId: string,
    producerId: string,
  ): Promise<{ id: string; name: string } | null> {
    return this.prisma.farm.findFirst({
      where: { id: farmId, producerId },
      select: { id: true, name: true },
    });
  }

  async createBatch(data: { productType: ProductType; farmId: string; quantity: number }) {
    return this.batchesService.create({
      productType: data.productType,
      quantity: data.quantity,
      unit: UNIT_BY_PRODUCT[data.productType],
      farmId: data.farmId,
    });
  }

  getUnit(productType: ProductType): string {
    return UNIT_BY_PRODUCT[productType];
  }

  buildPublicBatchUrl(batchCode: string): string {
    const baseUrl = this.resolvePublicBaseUrl();
    return `${baseUrl}/public/batches/${encodeURIComponent(batchCode)}`;
  }

  async buildPublicBatchUrlById(batchId: string): Promise<string | null> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { code: true },
    });

    if (!batch) {
      return null;
    }

    return this.buildPublicBatchUrl(batch.code);
  }

  private resolvePublicBaseUrl(): string {
    const configured =
      process.env.PUBLIC_BATCHES_URL ||
      process.env.PUBLIC_BACKEND_URL ||
      process.env.PUBLIC_APP_URL;

    if (!configured) {
      this.logger.warn(
        'Nenhuma env var de URL pública configurada (PUBLIC_BATCHES_URL, PUBLIC_BACKEND_URL, PUBLIC_APP_URL). ' +
        'Links de QR apontando para localhost.',
      );
    }

    const fallback = `http://localhost:${process.env.PORT ?? '3000'}`;
    return (configured || fallback).replace(/\/+$/, '');
  }
}
