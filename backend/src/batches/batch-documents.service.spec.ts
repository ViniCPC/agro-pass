import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BatchStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { BatchDocumentsService } from './batch-documents.service';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { BatchAuthorizationService } from './batch-authorization.service';
import { EventChainService } from '../event-chain/event-chain.service';
import { FILE_STORAGE } from '../storage/file-storage';

const ADMIN_USER = {
  sub: 'admin-uuid',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  producerId: null,
  cooperativeId: null,
} as const;

describe('BatchDocumentsService lifecycle guard', () => {
  let service: BatchDocumentsService;
  let batchFindUnique: jest.Mock;

  beforeEach(async () => {
    batchFindUnique = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        BatchDocumentsService,
        BatchLifecycleService,
        {
          provide: BatchAuthorizationService,
          useValue: { assertCanManageDocuments: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: { batch: { findUnique: batchFindUnique } },
        },
        {
          provide: EventChainService,
          useValue: { appendInTransaction: jest.fn() },
        },
        {
          provide: FILE_STORAGE,
          useValue: { upload: jest.fn(), delete: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(BatchDocumentsService);
  });

  it.each([BatchStatus.CLOSED, BatchStatus.CANCELLED])(
    'impede documento em lote %s',
    async (status) => {
      batchFindUnique.mockResolvedValue({ id: 'batch-uuid', status });

      await expect(
        service.addDocument(
          'batch-uuid',
          { type: 'INVOICE' },
          ADMIN_USER as never,
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    },
  );
});

describe('BatchDocumentsService visibility', () => {
  let service: BatchDocumentsService;
  let batchFindUnique: jest.Mock;
  let documentFindFirst: jest.Mock;
  let documentUpdate: jest.Mock;
  let assertCanManageDocuments: jest.Mock;

  beforeEach(async () => {
    batchFindUnique = jest.fn().mockResolvedValue({
      id: 'batch-uuid',
      status: BatchStatus.CLOSED,
      farm: { producerId: 'producer', producer: { cooperativeId: 'coop' } },
    });
    documentFindFirst = jest.fn();
    documentUpdate = jest.fn();
    assertCanManageDocuments = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        BatchDocumentsService,
        BatchLifecycleService,
        {
          provide: BatchAuthorizationService,
          useValue: { assertCanManageDocuments },
        },
        {
          provide: PrismaService,
          useValue: {
            batch: { findUnique: batchFindUnique },
            document: { findFirst: documentFindFirst, update: documentUpdate },
          },
        },
        { provide: EventChainService, useValue: {} },
        { provide: FILE_STORAGE, useValue: {} },
      ],
    }).compile();

    service = module.get(BatchDocumentsService);
  });

  it('publica documento mesmo em lote encerrado', async () => {
    documentFindFirst.mockResolvedValue({ id: 'doc-uuid' });
    documentUpdate.mockResolvedValue({
      id: 'doc-uuid',
      type: 'INVOICE',
      originalName: 'nf.pdf',
      fileUrl: '/uploads/documents/doc.pdf',
      size: 10,
      mimeType: 'application/pdf',
      fileHash: 'hash',
      isPublic: true,
      batchId: 'batch-uuid',
      traceEventId: 'event-uuid',
      createdAt: new Date(),
    });

    const result = await service.updateVisibility(
      'batch-uuid',
      'doc-uuid',
      true,
      ADMIN_USER,
    );

    expect(result.isPublic).toBe(true);
    expect(assertCanManageDocuments).toHaveBeenCalled();
    expect(documentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-uuid', batchId: 'batch-uuid' },
      }),
    );
    expect(documentUpdate).toHaveBeenCalledWith({
      where: { id: 'doc-uuid' },
      data: { isPublic: true },
    });
  });

  it('rejeita documento de outro lote', async () => {
    documentFindFirst.mockResolvedValue(null);

    await expect(
      service.updateVisibility('batch-uuid', 'doc-uuid', true, ADMIN_USER),
    ).rejects.toThrow(NotFoundException);
    expect(documentUpdate).not.toHaveBeenCalled();
  });
});
