import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BatchStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { EventChainService } from '../event-chain/event-chain.service';
import { BatchCodeService } from './batch-code.service';
import { BatchAuthorizationService } from './batch-authorization.service';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { BatchesService } from './batches.service';
import { BatchTokenizationService } from '../blockchain/batch-tokenization.service';

const AUTH_USER = {
  sub: 'user-uuid',
  name: 'Usuario Teste',
  email: 'user@example.com',
  role: 'ADMIN',
  producerId: null,
  cooperativeId: null,
} as const;

function makeFarm() {
  return {
    id: 'farm-uuid',
    name: 'Fazenda Teste',
    city: 'Rio Verde',
    state: 'GO',
    latitude: -17.79,
    longitude: -50.93,
    producer: { name: 'Produtor Teste' },
  };
}

function makeBatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'batch-uuid',
    code: 'AGP-2026-0001',
    publicCode: 'AGP-2026-0001',
    productType: 'COFFEE',
    quantity: 100,
    unit: 'sacas',
    harvestDate: null,
    status: BatchStatus.CREATED,
    isPublic: false,
    integrityHash: 'hash-inicial',
    tokenAddress: null,
    tokenizedAt: null,
    closedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    farmId: 'farm-uuid',
    farm: makeFarm(),
    ...overrides,
  };
}

describe('BatchesService', () => {
  let service: BatchesService;
  let farmFindUnique: jest.Mock;
  let batchCreate: jest.Mock;
  let batchFindUnique: jest.Mock;
  let batchFindUniqueOrThrow: jest.Mock;
  let batchUpdate: jest.Mock;
  let batchFindMany: jest.Mock;
  let batchCount: jest.Mock;
  let transaction: jest.Mock;
  let generateCode: jest.Mock;
  let appendEvent: jest.Mock;
  let lockBatch: jest.Mock;
  let scheduleAfterClose: jest.Mock;

  beforeEach(async () => {
    farmFindUnique = jest.fn();
    batchCreate = jest.fn();
    batchFindUnique = jest.fn();
    batchFindUniqueOrThrow = jest.fn();
    batchUpdate = jest.fn();
    batchFindMany = jest.fn().mockResolvedValue([]);
    batchCount = jest.fn().mockResolvedValue(0);
    appendEvent = jest.fn();
    lockBatch = jest.fn();
    scheduleAfterClose = jest.fn();
    transaction = jest.fn((input) =>
      typeof input === 'function'
        ? input({
            batch: {
              create: batchCreate,
              findUnique: batchFindUnique,
              findUniqueOrThrow: batchFindUniqueOrThrow,
              update: batchUpdate,
            },
          })
        : Promise.all(input),
    );
    generateCode = jest.fn().mockResolvedValue('AGP-2026-0001');

    const module = await Test.createTestingModule({
      providers: [
        BatchesService,
        BatchLifecycleService,
        {
          provide: BatchAuthorizationService,
          useValue: {
            assertCanCreate: jest.fn(),
            assertCanTransition: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            farm: { findUnique: farmFindUnique },
            batch: {
              create: batchCreate,
              findUnique: batchFindUnique,
              findUniqueOrThrow: batchFindUniqueOrThrow,
              findMany: batchFindMany,
              update: batchUpdate,
              count: batchCount,
            },
            $transaction: transaction,
          },
        },
        { provide: BatchCodeService, useValue: { generate: generateCode } },
        {
          provide: EventChainService,
          useValue: { appendInTransaction: appendEvent, lockBatch },
        },
        {
          provide: BatchTokenizationService,
          useValue: { scheduleAfterClose },
        },
      ],
    }).compile();

    service = module.get(BatchesService);
  });

  describe('create', () => {
    it('rejeita uma propriedade inexistente', async () => {
      farmFindUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            farmId: 'farm-uuid',
            productType: 'COFFEE',
            quantity: 50,
            unit: 'sacas',
          },
          AUTH_USER as never,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('cria um passaporte associado a propriedade', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      batchCreate.mockResolvedValue(makeBatch());
      batchFindUniqueOrThrow.mockResolvedValue(makeBatch());

      const result = await service.create(
        {
          farmId: 'farm-uuid',
          productType: 'COFFEE',
          quantity: 100,
          unit: ' sacas ',
        },
        AUTH_USER,
      );

      expect(result.code).toBe('AGP-2026-0001');
      expect(result.publicCode).toBe('AGP-2026-0001');
      expect(batchCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            farmId: 'farm-uuid',
            code: 'AGP-2026-0001',
            publicCode: 'AGP-2026-0001',
            unit: 'sacas',
          }),
        }),
      );
      expect(appendEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          batchId: 'batch-uuid',
          type: 'CREATED',
          recordedById: 'user-uuid',
        }),
      );
    });

    it('retenta quando o codigo colide', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      batchCreate
        .mockRejectedValueOnce({ code: 'P2002' })
        .mockResolvedValue(makeBatch({ code: 'AGP-2026-0002' }));
      batchFindUniqueOrThrow.mockResolvedValue(
        makeBatch({ code: 'AGP-2026-0002' }),
      );

      const result = await service.create(
        {
          farmId: 'farm-uuid',
          productType: 'COFFEE',
          quantity: 100,
          unit: 'sacas',
        },
        AUTH_USER,
      );

      expect(batchCreate).toHaveBeenCalledTimes(2);
      expect(result.code).toBe('AGP-2026-0002');
    });

    it('retorna conflito apos tres colisoes', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      batchCreate.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create(
          {
            farmId: 'farm-uuid',
            productType: 'COFFEE',
            quantity: 100,
            unit: 'sacas',
          },
          AUTH_USER as never,
        ),
      ).rejects.toThrow(ConflictException);
      expect(batchCreate).toHaveBeenCalledTimes(3);
    });
  });

  it('lista lotes com paginacao', async () => {
    transaction.mockResolvedValue([[makeBatch()], 21]);

    const result = await service.findAll(2, 10);

    expect(result.data).toHaveLength(1);
    expect(result.pagination).toMatchObject({
      page: 2,
      limit: 10,
      totalItems: 21,
      totalPages: 3,
    });
  });

  it('consulta um lote por id', async () => {
    batchFindUnique.mockResolvedValue(makeBatch());
    await expect(service.findOne('batch-uuid')).resolves.toMatchObject({
      id: 'batch-uuid',
      code: 'AGP-2026-0001',
    });
  });

  it('retorna 404 ao consultar lote inexistente', async () => {
    batchFindUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  describe('lifecycle', () => {
    it('aplica a proxima transicao e registra a etapa na linha do tempo', async () => {
      batchFindUnique.mockResolvedValue({
        id: 'batch-uuid',
        status: BatchStatus.CREATED,
        integrityHash: 'hash-inicial',
      });
      batchUpdate.mockResolvedValue(
        makeBatch({ status: BatchStatus.HARVESTED }),
      );
      batchFindUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'batch-uuid',
          status: BatchStatus.CREATED,
          farm: makeFarm(),
        })
        .mockResolvedValueOnce(makeBatch({ status: BatchStatus.HARVESTED }));

      const result = await service.updateStatus(
        'batch-uuid',
        { status: BatchStatus.HARVESTED },
        AUTH_USER,
      );

      expect(result.status).toBe(BatchStatus.HARVESTED);
      expect(batchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BatchStatus.HARVESTED,
          }),
        }),
      );
      expect(appendEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: 'HARVESTED' }),
      );
    });

    it('rejeita salto de CREATED para DELIVERED', async () => {
      batchFindUnique.mockResolvedValue({
        id: 'batch-uuid',
        status: BatchStatus.CREATED,
        integrityHash: null,
      });
      batchFindUniqueOrThrow.mockResolvedValue({
        id: 'batch-uuid',
        status: BatchStatus.CREATED,
        farm: makeFarm(),
      });

      await expect(
        service.updateStatus(
          'batch-uuid',
          { status: BatchStatus.DELIVERED },
          AUTH_USER as never,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(batchUpdate).not.toHaveBeenCalled();
    });

    it('cancela um lote ativo', async () => {
      batchFindUnique.mockResolvedValue({
        id: 'batch-uuid',
        status: BatchStatus.RECEIVED,
        integrityHash: null,
      });
      batchUpdate.mockResolvedValue(
        makeBatch({ status: BatchStatus.CANCELLED }),
      );
      batchFindUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'batch-uuid',
          status: BatchStatus.RECEIVED,
          farm: makeFarm(),
        })
        .mockResolvedValueOnce(makeBatch({ status: BatchStatus.CANCELLED }));

      await expect(
        service.cancel('batch-uuid', AUTH_USER as never),
      ).resolves.toMatchObject({
        status: BatchStatus.CANCELLED,
      });
    });

    it('fecha apenas um lote entregue e define closedAt', async () => {
      batchFindUnique.mockResolvedValue({
        id: 'batch-uuid',
        status: BatchStatus.DELIVERED,
        integrityHash: null,
      });
      batchUpdate.mockResolvedValue(
        makeBatch({ status: BatchStatus.CLOSED, closedAt: new Date() }),
      );
      batchFindUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'batch-uuid',
          status: BatchStatus.DELIVERED,
          farm: makeFarm(),
        })
        .mockResolvedValueOnce(
          makeBatch({ status: BatchStatus.CLOSED, closedAt: new Date() }),
        );

      await service.close('batch-uuid', AUTH_USER);

      expect(batchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BatchStatus.CLOSED,
            closedAt: expect.any(Date),
          }),
        }),
      );
      // The proof is registered only once the closing has committed.
      expect(scheduleAfterClose).toHaveBeenCalledWith('batch-uuid');
      expect(scheduleAfterClose.mock.invocationCallOrder[0]).toBeGreaterThan(
        transaction.mock.invocationCallOrder[0],
      );
    });

    it('nao registra prova ao avancar etapas intermediarias', async () => {
      batchFindUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'batch-uuid',
          status: BatchStatus.CREATED,
          farm: makeFarm(),
        })
        .mockResolvedValueOnce(makeBatch({ status: BatchStatus.HARVESTED }));

      await service.updateStatus(
        'batch-uuid',
        { status: BatchStatus.HARVESTED },
        AUTH_USER,
      );

      expect(scheduleAfterClose).not.toHaveBeenCalled();
    });

    it('nao reabre lote encerrado', async () => {
      batchFindUnique.mockResolvedValue({
        id: 'batch-uuid',
        status: BatchStatus.CLOSED,
        integrityHash: null,
      });
      batchFindUniqueOrThrow.mockResolvedValue({
        id: 'batch-uuid',
        status: BatchStatus.CLOSED,
        farm: makeFarm(),
      });

      await expect(
        service.updateStatus(
          'batch-uuid',
          { status: BatchStatus.IN_TRANSIT },
          AUTH_USER as never,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('informa somente as transicoes permitidas', async () => {
      batchFindUnique.mockResolvedValue({
        id: 'batch-uuid',
        status: BatchStatus.HARVESTED,
        integrityHash: null,
      });

      await expect(
        service.getAllowedTransitions('batch-uuid'),
      ).resolves.toEqual({
        currentStatus: BatchStatus.HARVESTED,
        allowedTransitions: [BatchStatus.RECEIVED, BatchStatus.CANCELLED],
      });
    });
  });

  it('torna o passaporte publico ou privado, inclusive depois do fechamento', async () => {
    batchFindUnique.mockResolvedValue({
      id: 'batch-uuid',
      status: BatchStatus.CLOSED,
      integrityHash: 'hash-final',
    });
    batchUpdate.mockResolvedValue(makeBatch({ isPublic: true }));

    const result = await service.updateVisibility('batch-uuid', {
      isPublic: true,
    });

    expect(result.isPublic).toBe(true);
    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isPublic: true } }),
    );
  });
});
