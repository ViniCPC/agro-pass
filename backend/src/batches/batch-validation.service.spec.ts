import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { BatchValidationService } from './batch-validation.service';

function makeBatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'batch-uuid',
    status: 'CREATED',
    farm: { latitude: -17.79, longitude: -50.93 },
    documents: [] as Array<{ type: DocumentType }>,
    ...overrides,
  };
}

describe('BatchValidationService', () => {
  let service: BatchValidationService;
  let batchFindUnique: jest.Mock;
  let batchUpdate: jest.Mock;

  beforeEach(async () => {
    batchFindUnique = jest.fn();
    batchUpdate = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        BatchValidationService,
        {
          provide: PrismaService,
          useValue: { batch: { findUnique: batchFindUnique, update: batchUpdate } },
        },
      ],
    }).compile();

    service = module.get(BatchValidationService);
  });

  it('lança NotFoundException quando o lote não existe', async () => {
    batchFindUnique.mockResolvedValue(null);

    await expect(service.validateBatch('x')).rejects.toThrow(NotFoundException);
  });

  it('lança BadRequestException quando o lote não tem documentos', async () => {
    batchFindUnique.mockResolvedValue(makeBatch({ documents: [] }));

    await expect(service.validateBatch('batch-uuid')).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequestException quando não há documento do tipo CAR', async () => {
    batchFindUnique.mockResolvedValue(
      makeBatch({ documents: [{ type: DocumentType.INVOICE }] }),
    );

    await expect(service.validateBatch('batch-uuid')).rejects.toThrow(BadRequestException);
  });

  it('valida com sucesso quando há documento CAR', async () => {
    batchFindUnique.mockResolvedValue(
      makeBatch({ documents: [{ type: DocumentType.CAR }] }),
    );
    batchUpdate.mockResolvedValue({ id: 'batch-uuid', status: 'VERIFIED' });

    const result = await service.validateBatch('batch-uuid');

    expect(result.status).toBe('VERIFIED');
    expect(result.checks.carDocumentFound).toBe(true);
  });

  it('atualiza o status do lote para VERIFIED', async () => {
    batchFindUnique.mockResolvedValue(
      makeBatch({ documents: [{ type: DocumentType.CAR }] }),
    );
    batchUpdate.mockResolvedValue({ id: 'batch-uuid', status: 'VERIFIED' });

    await service.validateBatch('batch-uuid');

    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'VERIFIED' } }),
    );
  });

  it('retorna a contagem correta de documentos validados', async () => {
    batchFindUnique.mockResolvedValue(
      makeBatch({
        documents: [{ type: DocumentType.CAR }, { type: DocumentType.INVOICE }],
      }),
    );
    batchUpdate.mockResolvedValue({ id: 'batch-uuid', status: 'VERIFIED' });

    const result = await service.validateBatch('batch-uuid');

    expect(result.documentsValidated).toBe(2);
  });

  it('farmLocationProvided é true quando fazenda tem coordenadas válidas', async () => {
    batchFindUnique.mockResolvedValue(
      makeBatch({
        farm: { latitude: -17.79, longitude: -50.93 },
        documents: [{ type: DocumentType.CAR }],
      }),
    );
    batchUpdate.mockResolvedValue({ id: 'batch-uuid', status: 'VERIFIED' });

    const result = await service.validateBatch('batch-uuid');

    expect(result.checks.farmLocationProvided).toBe(true);
  });

  it('farmLocationProvided é false quando fazenda não tem coordenadas', async () => {
    batchFindUnique.mockResolvedValue(
      makeBatch({
        farm: { latitude: null, longitude: null },
        documents: [{ type: DocumentType.CAR }],
      }),
    );
    batchUpdate.mockResolvedValue({ id: 'batch-uuid', status: 'VERIFIED' });

    const result = await service.validateBatch('batch-uuid');

    expect(result.checks.farmLocationProvided).toBe(false);
  });

  it('aceita CAR junto com outros tipos de documento', async () => {
    batchFindUnique.mockResolvedValue(
      makeBatch({
        documents: [
          { type: DocumentType.INVOICE },
          { type: DocumentType.CAR },
          { type: DocumentType.ENVIRONMENTAL_REPORT },
        ],
      }),
    );
    batchUpdate.mockResolvedValue({ id: 'batch-uuid', status: 'VERIFIED' });

    const result = await service.validateBatch('batch-uuid');

    expect(result.checks.carDocumentFound).toBe(true);
    expect(result.documentsValidated).toBe(3);
  });
});
