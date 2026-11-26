import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BatchCodeService {
  constructor(private readonly prisma: PrismaService) {}

  // Demo batches use their own DEMO- sequence, so they never take real codes.
  async generate(harvestDate?: Date, prefix = 'AGP'): Promise<string> {
    const year = (harvestDate ?? new Date()).getUTCFullYear();
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
