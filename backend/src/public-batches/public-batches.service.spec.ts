import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EventChainService } from '../event-chain/event-chain.service';
import { PublicBatchesService } from './public-batches.service';

function makeDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-1',
    type: 'INVOICE',
    originalName: 'nf-joao-da-silva-cpf-12345678901.pdf',
    fileUrl: '/uploads/documents/doc-1.pdf',
    size: 2048,
    mimeType: 'application/pdf',
    fileHash: 'a'.repeat(64),
    isPublic: false,
    createdAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

function makeBatch() {
  return {
    id: 'batch-1',
    code: 'AGP-2026-0001',
    publicCode: 'AGP-2026-0001',
    isPublic: true,
    productType: 'COFFEE',
    quantity: 100,
    unit: 'sacas',
    harvestDate: null,
    status: 'HARVESTED',
    integrityHash: 'hash-2',
    tokenizationStatus: 'NONE',
    proofHash: null,
    tokenAddress: null,
    tokenTxHash: null,
    tokenizedAt: null,
    blockchainNetwork: null,
    closedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    farm: {
      id: 'farm-1',
      name: 'Fazenda Santa Fe',
      city: 'Rio Verde',
      state: 'GO',
      latitude: -17.791234,
      longitude: -50.935678,
      carNumber: 'GO-5214-XXX',
      totalAreaHa: 500,
      producer: { name: 'Joao da Silva' },
    },
    documents: [
      makeDocument(),
      makeDocument({
        id: 'doc-2',
        originalName: 'recibo-armazem.pdf',
        fileUrl: '/uploads/documents/doc-2.pdf',
        fileHash: 'b'.repeat(64),
        isPublic: true,
      }),
    ],
    traceEvents: [
      {
        id: 'event-1',
        type: 'CREATED',
        sequence: 1,
        location: 'Rio Verde, GO',
        latitude: -17.791234,
        longitude: -50.935678,
        notes: null,
        previousHash: null,
        eventHash: 'hash-1',
        txHash: null,
        recordedBy: { name: 'Joao da Silva', role: 'PRODUCER' },
        recordedAt: new Date('2026-01-01T08:00:00Z'),
        correctedEventId: null,
        documents: [],
      },
      {
        id: 'event-2',
        type: 'DOCUMENT_ATTACHED',
        sequence: 2,
        location: null,
        latitude: null,
        longitude: null,
        notes: 'Documento anexado: nf-joao-da-silva-cpf-12345678901.pdf',
        previousHash: 'hash-1',
        eventHash: 'hash-2',
        txHash: null,
        recordedBy: { name: 'Cooperativa Central', role: 'COOPERATIVE' },
        recordedAt: new Date('2026-01-02T08:00:00Z'),
        correctedEventId: null,
        documents: [makeDocument()],
      },
    ],
  };
}

describe('PublicBatchesService', () => {
  let service: PublicBatchesService;
  let batchFindFirst: jest.Mock;
  let documentFindMany: jest.Mock;
  let verifyIntegrity: jest.Mock;

  beforeEach(async () => {
    batchFindFirst = jest.fn();
    documentFindMany = jest.fn().mockResolvedValue([]);
    verifyIntegrity = jest.fn().mockResolvedValue({
      valid: true,
      eventCount: 2,
      finalHash: 'hash-2',
      storedFinalHash: 'hash-2',
      errors: [],
    });

    const module = await Test.createTestingModule({
      providers: [
        PublicBatchesService,
        {
          provide: PrismaService,
          useValue: {
            batch: { findFirst: batchFindFirst },
            document: { findMany: documentFindMany },
          },
        },
        {
          provide: EventChainService,
          useValue: { verify: verifyIntegrity },
        },
      ],
    }).compile();

    service = module.get(PublicBatchesService);
  });

  it('verifica integridade apenas de passaporte publico', async () => {
    batchFindFirst.mockResolvedValue({ id: 'batch-1' });

    await expect(
      service.verifyIntegrity('AGP-2026-0001'),
    ).resolves.toMatchObject({ valid: true });
    expect(verifyIntegrity).toHaveBeenCalledWith('batch-1');

    batchFindFirst.mockResolvedValue(null);
    await expect(service.verifyIntegrity('privado')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('oculta passaporte inexistente ou privado', async () => {
    batchFindFirst.mockResolvedValue(null);

    await expect(service.findByCode('private-code')).rejects.toThrow(
      NotFoundException,
    );
    expect(batchFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicCode: 'private-code', isPublic: true },
      }),
    );
  });

  it('retorna o passaporte publico, a linha do tempo e a integridade', async () => {
    batchFindFirst.mockResolvedValue(makeBatch());

    const result = await service.findByCode('AGP-2026-0001');

    expect(result.batch).toMatchObject({
      code: 'AGP-2026-0001',
      publicCode: 'AGP-2026-0001',
      isPublic: true,
      status: 'HARVESTED',
      integrityHash: 'hash-2',
    });
    expect(result.blockchain).toEqual({
      status: 'NONE',
      network: null,
      proofHash: null,
      tokenAddress: null,
      txHash: null,
      tokenizedAt: null,
      explorerTxUrl: null,
      explorerTokenUrl: null,
    });
    expect(result.traceEvents).toHaveLength(2);
    expect(result.traceEvents[0].actor).toEqual({
      name: 'Joao da Silva',
      role: 'PRODUCER',
    });
    expect(result.integrity).toMatchObject({
      valid: true,
      eventCount: 2,
      finalHash: 'hash-2',
      errors: [],
    });
    expect(verifyIntegrity).toHaveBeenCalledWith('batch-1');
    expect(documentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { farmId: 'farm-1' } }),
    );
  });

  it('nao expoe identificadores internos nem localizacao exata', async () => {
    batchFindFirst.mockResolvedValue(makeBatch());

    const result = await service.findByCode('AGP-2026-0001');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('recordedById');
    expect(serialized).not.toContain('userId');
    expect(serialized).not.toContain('reputationScore');
    expect(result.farm).not.toHaveProperty('id');
    expect(result.farm).toMatchObject({ latitude: -17.79, longitude: -50.94 });
    expect(result.traceEvents[0]).toMatchObject({
      latitude: -17.79,
      longitude: -50.94,
    });
  });

  it('publica apenas o hash de documentos restritos', async () => {
    batchFindFirst.mockResolvedValue(makeBatch());

    const result = await service.findByCode('AGP-2026-0001');
    const restricted = result.documents.find((doc) => doc.id === 'doc-1');
    const published = result.documents.find((doc) => doc.id === 'doc-2');

    expect(restricted).toMatchObject({
      isPublic: false,
      fileUrl: null,
      originalName: null,
      fileHash: 'a'.repeat(64),
      scope: 'BATCH',
    });
    expect(published).toMatchObject({
      isPublic: true,
      fileUrl: '/uploads/documents/doc-2.pdf',
      originalName: 'recibo-armazem.pdf',
    });

    const attachment = result.traceEvents[1];
    expect(attachment.documents[0]).toMatchObject({
      fileUrl: null,
      originalName: null,
    });
    // The system note embeds the restricted file name.
    expect(attachment.notes).toBeNull();
    expect(attachment.customStageName).toBeNull();
    expect(JSON.stringify(result)).not.toContain('cpf-12345678901');
  });
});

describe('PublicBatchesService blockchain proof', () => {
  it('exibe o hash ancorado e um link verificavel no explorer', async () => {
    const proofHash = 'e'.repeat(64);
    const module = await Test.createTestingModule({
      providers: [
        PublicBatchesService,
        {
          provide: PrismaService,
          useValue: {
            batch: {
              findFirst: jest.fn().mockResolvedValue({
                ...makeBatch(),
                status: 'CLOSED',
                integrityHash: proofHash,
                tokenizationStatus: 'CONFIRMED',
                proofHash,
                tokenAddress: 'Asset111',
                tokenTxHash: 'Tx111',
                tokenizedAt: new Date('2026-02-01T00:00:00Z'),
                blockchainNetwork: 'devnet',
              }),
            },
            document: { findMany: jest.fn().mockResolvedValue([]) },
          },
        },
        {
          provide: EventChainService,
          useValue: {
            verify: jest.fn().mockResolvedValue({
              valid: true,
              eventCount: 2,
              finalHash: proofHash,
              errors: [],
            }),
          },
        },
      ],
    }).compile();

    const result = await module
      .get(PublicBatchesService)
      .findByCode('AGP-2026-0001');

    expect(result.blockchain).toMatchObject({
      status: 'CONFIRMED',
      proofHash,
      explorerTxUrl: 'https://explorer.solana.com/tx/Tx111?cluster=devnet',
      explorerTokenUrl:
        'https://explorer.solana.com/address/Asset111?cluster=devnet',
    });
    expect(result.blockchain.proofHash).toBe(result.integrity.finalHash);
  });
});
