import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PublicBatchesService } from './public-batches.service';

function makeTraceEvent(id: string, createdAt: Date) {
  return {
    id,
    type: 'CREATED',
    actorName: 'Joao da Silva',
    location: null,
    latitude: null,
    longitude: null,
    eventHash: 'abc123',
    txHash: null,
    createdAt,
  };
}

function makeBatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'batch-1',
    code: 'CAF-2026-0001',
    productType: 'COFFEE',
    quantity: 100,
    unit: 'sacas',
    harvestDate: null,
    status: 'CREATED',
    cnftAddress: null,
    merkleTree: null,
    metadataUri: null,
    qrCodeUrl: null,
    mintTxHash: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    farm: {
      id: 'farm-1',
      name: 'Fazenda Santa Fe',
      city: 'Rio Verde',
      state: 'GO',
      latitude: -17.79,
      longitude: -50.93,
      carNumber: 'GO-5214-XXX',
      totalAreaHa: 500,
      legalReserveAreaHa: 100,
      appAreaHa: 20,
      consolidatedAreaHa: 380,
      biome: 'CERRADO',
      isAmazonLegal: false,
      producer: { name: 'Joao da Silva', reputationScore: 0 },
      lastValidation: null,
    },
    documents: [],
    traceEvents: [
      makeTraceEvent('evt-1', new Date('2026-01-01T08:00:00Z')),
      makeTraceEvent('evt-2', new Date('2026-01-01T10:00:00Z')),
    ],
    ...overrides,
  };
}

describe('PublicBatchesService', () => {
  let service: PublicBatchesService;
  let batchFindUnique: jest.Mock;
  let documentFindMany: jest.Mock;

  beforeEach(async () => {
    batchFindUnique = jest.fn();
    documentFindMany = jest.fn().mockResolvedValue([]);

    const module = await Test.createTestingModule({
      providers: [
        PublicBatchesService,
        {
          provide: PrismaService,
          useValue: {
            batch: { findUnique: batchFindUnique },
            document: { findMany: documentFindMany },
          },
        },
      ],
    }).compile();

    service = module.get(PublicBatchesService);
  });

  describe('findByCode', () => {
    it('throws NotFoundException when code does not exist', async () => {
      batchFindUnique.mockResolvedValue(null);

      await expect(service.findByCode('NOTEXIST')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns batch / blockchain / farm / traceEvents / documents', async () => {
      batchFindUnique.mockResolvedValue(makeBatch());

      const result = await service.findByCode('CAF-2026-0001');

      expect(result.batch).toMatchObject({
        id: 'batch-1',
        code: 'CAF-2026-0001',
        productType: 'COFFEE',
        quantity: 100,
        unit: 'sacas',
        status: 'CREATED',
      });

      expect(result.blockchain).toMatchObject({
        cnftAddress: null,
        merkleTree: null,
        metadataUri: null,
        mintTxHash: null,
      });

      expect(result.farm.name).toBe('Fazenda Santa Fe');
      expect(result.farm.producer.name).toBe('Joao da Silva');
      expect(result.traceEvents).toHaveLength(2);
      expect(result.documents).toHaveLength(0);
    });

    it('keeps traceEvents in ascending chronological order', async () => {
      const earlier = new Date('2026-01-01T08:00:00Z');
      const later = new Date('2026-01-01T10:00:00Z');

      batchFindUnique.mockResolvedValue(
        makeBatch({
          traceEvents: [
            makeTraceEvent('evt-1', earlier),
            makeTraceEvent('evt-2', later),
          ],
        }),
      );

      const result = await service.findByCode('CAF-2026-0001');

      expect(result.traceEvents[0].createdAt).toEqual(earlier);
      expect(result.traceEvents[1].createdAt).toEqual(later);
    });

    it('queries Prisma with code and farm document lookup', async () => {
      batchFindUnique.mockResolvedValue(makeBatch());

      await service.findByCode('CAF-2026-0001');

      expect(batchFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: 'CAF-2026-0001' } }),
      );
      expect(documentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { farmId: 'farm-1' } }),
      );
    });
  });
});
