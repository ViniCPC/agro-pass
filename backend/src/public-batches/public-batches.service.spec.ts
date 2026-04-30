import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PublicBatchesService } from './public-batches.service';

function makeTraceEvent(id: string, createdAt: Date) {
  return {
    id,
    type: 'CREATED',
    actorName: 'João da Silva',
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
      name: 'Fazenda Santa Fé',
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
      isEudrCompliant: true,
      eudrEvidenceUrl: null,
      validatedAt: null,
      producer: { name: 'João da Silva', reputationScore: 0 },
    },
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

  beforeEach(async () => {
    batchFindUnique = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        PublicBatchesService,
        {
          provide: PrismaService,
          useValue: { batch: { findUnique: batchFindUnique } },
        },
      ],
    }).compile();

    service = module.get(PublicBatchesService);
  });

  // ─── findByCode ──────────────────────────────────────────────────────

  describe('findByCode', () => {
    it('lança NotFoundException quando o código não existe', async () => {
      batchFindUnique.mockResolvedValue(null);

      await expect(service.findByCode('NOTEXIST')).rejects.toThrow(NotFoundException);
    });

    it('retorna estrutura batch / blockchain / farm / traceEvents no caminho feliz', async () => {
      batchFindUnique.mockResolvedValue(makeBatch());

      const result = await service.findByCode('CAF-2026-0001');

      // Dados do lote
      expect(result.batch.id).toBe('batch-1');
      expect(result.batch.code).toBe('CAF-2026-0001');
      expect(result.batch.productType).toBe('COFFEE');
      expect(result.batch.quantity).toBe(100);
      expect(result.batch.unit).toBe('sacas');
      expect(result.batch.status).toBe('CREATED');

      // Campos blockchain presentes (null se ainda não mintado)
      expect(result.blockchain).toMatchObject({
        cnftAddress: null,
        merkleTree: null,
        metadataUri: null,
        mintTxHash: null,
      });

      // Fazenda com produtor aninhado
      expect(result.farm.name).toBe('Fazenda Santa Fé');
      expect(result.farm.producer.name).toBe('João da Silva');

      // Eventos presentes
      expect(result.traceEvents).toHaveLength(2);
    });

    it('passa traceEvents na ordem cronológica retornada pelo Prisma (ASC)', async () => {
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

    it('chama Prisma com o código correto', async () => {
      batchFindUnique.mockResolvedValue(makeBatch());

      await service.findByCode('CAF-2026-0001');

      expect(batchFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: 'CAF-2026-0001' } }),
      );
    });
  });
});
