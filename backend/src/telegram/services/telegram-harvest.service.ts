import { Injectable } from '@nestjs/common';
import { ProductType } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchesService } from '../../batches/batches.service';
import { UNIT_BY_PRODUCT } from '../ui/telegram.messages';

@Injectable()
export class TelegramHarvestService {
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
}
