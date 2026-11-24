import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BatchCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(harvestDate?: Date): Promise<string> {
    const year = (harvestDate ?? new Date()).getUTCFullYear();
    const codePrefix = `AGP-${year}-`;

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
