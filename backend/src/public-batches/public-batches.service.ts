import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicBatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string) {
    const batch = await this.prisma.batch.findUnique({
      where: {
        code,
      },
      select: {
        id: true,
        code: true,
        productType: true,
        quantity: true,
        unit: true,
        harvestDate: true,
        status: true,

        cnftAddress: true,
        merkleTree: true,
        metadataUri: true,
        qrCodeUrl: true,
        mintTxHash: true,

        createdAt: true,
        updatedAt: true,

        farm: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
            carNumber: true,

            totalAreaHa: true,
            legalReserveAreaHa: true,
            appAreaHa: true,
            consolidatedAreaHa: true,
            biome: true,
            isAmazonLegal: true,

            isEudrCompliant: true,
            eudrEvidenceUrl: true,
            validatedAt: true,

            producer: {
              select: {
                name: true,
                reputationScore: true,
              },
            },
          },
        },

        traceEvents: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            type: true,
            actorName: true,
            location: true,
            latitude: true,
            longitude: true,
            eventHash: true,
            txHash: true,
            createdAt: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote não encontrado');
    }

    return {
      batch: {
        id: batch.id,
        code: batch.code,
        productType: batch.productType,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        status: batch.status,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
      },

      blockchain: {
        cnftAddress: batch.cnftAddress,
        merkleTree: batch.merkleTree,
        metadataUri: batch.metadataUri,
        mintTxHash: batch.mintTxHash,
      },

      farm: batch.farm,

      traceEvents: batch.traceEvents,
    };
  }
}