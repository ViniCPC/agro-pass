import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BatchStatus } from '../../generated/prisma/enums';
import { EventChainService } from '../event-chain/event-chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { FILE_STORAGE } from '../storage/file-storage';
import { BatchAuthorizationService } from './batch-authorization.service';
import { BatchDocumentsService } from './batch-documents.service';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { MAX_UPLOAD_SIZE_IN_BYTES } from './document-upload.constants';

const ADMIN = {
  sub: 'admin-uuid',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
  producerId: null,
  cooperativeId: null,
};

const PDF = Buffer.from('%PDF-1.4\n% nota fiscal\n%%EOF\n');

function multerFile(buffer: Buffer, mimetype: string, size = buffer.length) {
  return {
    buffer,
    mimetype,
    size,
    originalname: 'evidencia.pdf',
  } as Express.Multer.File;
}

describe('BatchDocumentsService uploads', () => {
  let service: BatchDocumentsService;
  let upload: jest.Mock;
  let appendInTransaction: jest.Mock;
  let currentBatch: jest.Mock;
  let deleteFile: jest.Mock;
  let findDocument: jest.Mock;

  beforeEach(async () => {
    upload = jest.fn().mockResolvedValue({
      key: 'documents/abc.pdf',
      url: '/uploads/documents/abc.pdf',
      originalName: 'evidencia.pdf',
      size: PDF.length,
      mimeType: 'application/pdf',
      hash: 'f'.repeat(64),
    });
    appendInTransaction = jest.fn();
    currentBatch = jest
      .fn()
      .mockResolvedValue({ status: BatchStatus.RECEIVED });
    deleteFile = jest.fn().mockResolvedValue(undefined);
    findDocument = jest.fn().mockResolvedValue(null);
    const created = {
      id: 'doc-uuid',
      type: 'INVOICE',
      originalName: 'evidencia.pdf',
      fileUrl: '/uploads/documents/abc.pdf',
      size: PDF.length,
      mimeType: 'application/pdf',
      fileHash: 'f'.repeat(64),
      isPublic: false,
      batchId: 'batch-uuid',
      traceEventId: 'event-uuid',
      createdAt: new Date(),
    };
    const documentApi = {
      create: jest.fn().mockResolvedValue(created),
      findUniqueOrThrow: jest.fn().mockResolvedValue(created),
    };

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
          useValue: {
            batch: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'batch-uuid',
                status: BatchStatus.RECEIVED,
              }),
            },
            document: { findUnique: findDocument },
            $transaction: jest.fn(
              (callback: (tx: unknown) => Promise<unknown>) =>
                callback({
                  document: documentApi,
                  batch: { findUniqueOrThrow: currentBatch },
                }),
            ),
          },
        },
        {
          provide: EventChainService,
          useValue: { appendInTransaction, lockBatch: jest.fn() },
        },
        { provide: FILE_STORAGE, useValue: { upload, delete: deleteFile } },
      ],
    }).compile();

    service = module.get(BatchDocumentsService);
  });

  const add = (file?: Express.Multer.File) =>
    service.addDocument('batch-uuid', { type: 'INVOICE' }, ADMIN, file);

  it('recusa lote encerrado durante upload e remove o arquivo', async () => {
    currentBatch.mockResolvedValue({ status: BatchStatus.CLOSED });
    await expect(add(multerFile(PDF, 'application/pdf'))).rejects.toThrow(
      BadRequestException,
    );
    expect(appendInTransaction).not.toHaveBeenCalled();
    expect(deleteFile).toHaveBeenCalledWith('documents/abc.pdf');
  });

  it('remove o arquivo se a consulta ao banco falhar', async () => {
    findDocument.mockRejectedValue(new Error('database offline'));
    await expect(add(multerFile(PDF, 'application/pdf'))).rejects.toThrow(
      'database offline',
    );
    expect(deleteFile).toHaveBeenCalledWith('documents/abc.pdf');
  });

  it('aceita um PDF real e o encadeia como evento', async () => {
    await expect(
      add(multerFile(PDF, 'application/pdf')),
    ).resolves.toMatchObject({ id: 'doc-uuid', mimeType: 'application/pdf' });
    expect(upload).toHaveBeenCalled();
    expect(appendInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'DOCUMENT_ATTACHED',
        documentIds: ['doc-uuid'],
      }),
    );
  });

  it.each([
    ['sem arquivo', undefined],
    ['tipo nao aceito', multerFile(PDF, 'text/html')],
    [
      'arquivo grande demais',
      multerFile(PDF, 'application/pdf', MAX_UPLOAD_SIZE_IN_BYTES + 1),
    ],
    [
      'conteudo que nao e PDF',
      multerFile(Buffer.from('MZ executavel'), 'application/pdf'),
    ],
    [
      'PNG declarado como PDF',
      multerFile(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        'application/pdf',
      ),
    ],
  ])('rejeita %s antes de gravar qualquer coisa', async (_case, file) => {
    await expect(add(file)).rejects.toThrow(BadRequestException);
    expect(upload).not.toHaveBeenCalled();
  });
});
