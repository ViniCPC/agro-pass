import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BatchCodeService } from './batch-code.service';
import { BatchesService } from './batches.service';

function makeBatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'batch-uuid',
    code: 'CAF-2026-0001',
    productType: 'COFFEE',
    quantity: 100,
    unit: 'sacas',
    harvestDate: null,
    status: 'CREATED',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    farm: { name: 'Fazenda Test', latitude: -17.79, longitude: -50.93 },
    ...overrides,
  };
}

describe('BatchesService', () => {
  let service: BatchesService;
  let farmFindUnique: jest.Mock;
  let batchCreate: jest.Mock;
  let batchFindUnique: jest.Mock;
  let batchUpdate: jest.Mock;
  let batchDelete: jest.Mock;
  let $transaction: jest.Mock;
  let generateCode: jest.Mock;

  beforeEach(async () => {
    farmFindUnique = jest.fn();
    batchCreate = jest.fn();
    batchFindUnique = jest.fn();
    batchUpdate = jest.fn();
    batchDelete = jest.fn();
    generateCode = jest.fn().mockResolvedValue('CAF-2026-0001');
    $transaction = jest
      .fn()
      .mockImplementation((arg: unknown) =>
        Array.isArray(arg)
          ? Promise.all(arg)
          : (arg as (tx: unknown) => unknown)({}),
      );

    const module = await Test.createTestingModule({
      providers: [
        BatchesService,
        {
          provide: PrismaService,
          useValue: {
            farm: { findUnique: farmFindUnique },
            batch: {
              create: batchCreate,
              findUnique: batchFindUnique,
              findMany: jest.fn().mockResolvedValue([]),
              update: batchUpdate,
              delete: batchDelete,
              count: jest.fn().mockResolvedValue(0),
            },
            $transaction,
          },
        },
        { provide: BatchCodeService, useValue: { generate: generateCode } },
      ],
    }).compile();

    service = module.get(BatchesService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lança NotFoundException quando a fazenda não existe', async () => {
      farmFindUnique.mockResolvedValue(null);

      await expect(
        service.create({
          farmId: 'f-1',
          productType: 'COFFEE' as any,
          quantity: 50,
          unit: 'sacas',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('cria lote no caminho feliz', async () => {
      farmFindUnique.mockResolvedValue({
        id: 'f-1',
        lastValidationStatus: 'COMPLIANT',
      });
      batchCreate.mockResolvedValue(makeBatch());

      const result = await service.create({
        farmId: 'f-1',
        productType: 'COFFEE' as any,
        quantity: 100,
        unit: 'sacas',
      });

      expect(result.code).toBe('CAF-2026-0001');
      expect(result.productType).toBe('COFFEE');
    });

    it('retenta geração de código ao encontrar conflito único (P2002)', async () => {
      farmFindUnique.mockResolvedValue({
        id: 'f-1',
        lastValidationStatus: 'COMPLIANT',
      });
      batchCreate
        .mockRejectedValueOnce({ code: 'P2002' })
        .mockResolvedValue(makeBatch({ code: 'CAF-2026-0002' }));

      const result = await service.create({
        farmId: 'f-1',
        productType: 'COFFEE' as any,
        quantity: 100,
        unit: 'sacas',
      });

      expect(batchCreate).toHaveBeenCalledTimes(2);
      expect(result.code).toBe('CAF-2026-0002');
    });

    it('propaga o erro após esgotar as 3 tentativas e chama create 3 vezes', async () => {
      farmFindUnique.mockResolvedValue({
        id: 'f-1',
        lastValidationStatus: 'COMPLIANT',
      });
      batchCreate.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({
          farmId: 'f-1',
          productType: 'COFFEE' as any,
          quantity: 100,
          unit: 'sacas',
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      expect(batchCreate).toHaveBeenCalledTimes(3);
    });

    it('trimeia o campo unit', async () => {
      farmFindUnique.mockResolvedValue({
        id: 'f-1',
        lastValidationStatus: 'COMPLIANT',
      });
      batchCreate.mockResolvedValue(makeBatch({ unit: 'sacas' }));

      await service.create({
        farmId: 'f-1',
        productType: 'COFFEE' as any,
        quantity: 100,
        unit: '  sacas  ',
      });

      expect(batchCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ unit: 'sacas' }),
        }),
      );
    });

    it('bloqueia criação quando a fazenda não está COMPLIANT', async () => {
      farmFindUnique.mockResolvedValue({
        id: 'f-1',
        lastValidationStatus: 'NEEDS_REVIEW',
      });

      await expect(
        service.create({
          farmId: 'f-1',
          productType: 'COFFEE' as any,
          quantity: 100,
          unit: 'sacas',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(batchCreate).not.toHaveBeenCalled();
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retorna página com dados e paginação', async () => {
      $transaction.mockResolvedValue([
        [makeBatch(), makeBatch({ id: 'b-2' })],
        2,
      ]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('calcula totalPages corretamente', async () => {
      $transaction.mockResolvedValue([[makeBatch()], 25]);

      const result = await service.findAll(1, 10);

      expect(result.pagination.totalPages).toBe(3);
    });

    it('retorna totalPages mínimo 1 quando sem registros', async () => {
      $transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll(1, 10);

      expect(result.pagination.totalPages).toBe(1);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retorna batch existente', async () => {
      batchFindUnique.mockResolvedValue(makeBatch());

      const result = await service.findOne('batch-uuid');

      expect(result.id).toBe('batch-uuid');
      expect(result.code).toBe('CAF-2026-0001');
    });

    it('lança NotFoundException quando batch não existe', async () => {
      batchFindUnique.mockResolvedValue(null);

      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('atualiza status corretamente', async () => {
      batchFindUnique.mockResolvedValue({ id: 'batch-uuid' });
      batchUpdate.mockResolvedValue(makeBatch({ status: 'VERIFIED' }));

      const result = await service.updateStatus('batch-uuid', {
        status: 'VERIFIED' as any,
      });

      expect(result.status).toBe('VERIFIED');
    });

    it('lança NotFoundException quando batch não existe', async () => {
      batchFindUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('x', { status: 'VERIFIED' as any }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('remove batch existente sem erro', async () => {
      batchFindUnique.mockResolvedValue({ id: 'batch-uuid' });
      batchDelete.mockResolvedValue({});

      await expect(service.remove('batch-uuid')).resolves.toBeUndefined();
    });

    it('lança NotFoundException quando batch não existe', async () => {
      batchFindUnique.mockResolvedValue(null);

      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });
});
