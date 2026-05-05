import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicBatchesService } from './public-batches.service';

@Controller('public/batches')
export class PublicBatchesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicBatchesService: PublicBatchesService,
  ) {}

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.publicBatchesService.findByCode(code);
  }

  @Get(':code/metadata.json')
  async getBatchMetadata(@Param('code') code: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { code },
      include: {
        farm: {
          include: {
            producer: true,
            lastValidation: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote não encontrado');
    }

    return {
      name: `AgroPass Batch ${batch.code}`,
      symbol: 'AGROPASS',
      description:
        'Digital product passport for agricultural traceability and proof of origin.',
      image: 'https://placehold.co/600x600/png?text=AgroPass',
      latestEvidenceHash: batch.farm.lastValidation?.evidenceHash ?? null,
      attributes: [
        {
          trait_type: 'Batch Code',
          value: batch.code,
        },
        {
          trait_type: 'Product Type',
          value: batch.productType,
        },
        {
          trait_type: 'Quantity',
          value: `${batch.quantity} ${batch.unit}`,
        },
        {
          trait_type: 'Farm',
          value: batch.farm.name,
        },
        {
          trait_type: 'City',
          value: batch.farm.city,
        },
        {
          trait_type: 'State',
          value: batch.farm.state,
        },
        {
          trait_type: 'Producer',
          value: batch.farm.producer.name,
        },
        {
          trait_type: 'EUDR Status',
          value: batch.farm.lastValidation?.status ?? 'PENDING',
        },
        {
          trait_type: 'Latest Evidence Hash',
          value: batch.farm.lastValidation?.evidenceHash ?? 'NONE',
        },
      ],
      properties: {
        category: 'image',
        files: [
          {
            uri: 'https://placehold.co/600x600/png?text=AgroPass',
            type: 'image/png',
          },
        ],
      },
    };
  }
}
