import { Injectable } from '@nestjs/common';
import { ProductType } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CODE_PREFIX: Record<ProductType, string> = {
  COFFEE: 'CAF',
  SOY: 'SOY',
  CATTLE: 'CAT',
};

@Injectable()
export class BatchCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    productType: ProductType,
    harvestDate?: Date,
  ): Promise<string> {
    const prefix = CODE_PREFIX[productType];
    const year = (harvestDate ?? new Date()).getFullYear();
    const codePrefix = `${prefix}-${year}-`;

    const existingCodes = await this.prisma.batch.findMany({
      where: { code: { startsWith: codePrefix } },
      select: { code: true },
    });

    const lastSequence = existingCodes.reduce((highest, batch) => {
      const sequence = Number(batch.code.split('-')[2]);
      return Number.isNaN(sequence) ? highest : Math.max(highest, sequence);
    }, 0);

    return `${codePrefix}${String(lastSequence + 1).padStart(4, '0')}`;
  }
}
