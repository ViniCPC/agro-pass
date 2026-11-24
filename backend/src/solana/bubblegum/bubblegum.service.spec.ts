import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BatchStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { EventChainService } from '../../event-chain/event-chain.service';
import { BubblegumService } from './bubblegum.service';

const MOCK_TX_HASH = 'mock-tx-hash-base58';
const MOCK_TOKEN_ADDRESS = 'mock-token-address';
const AUTH_USER = {
  sub: 'admin-uuid',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  producerId: null,
  cooperativeId: null,
} as const;

jest.mock('@metaplex-foundation/mpl-bubblegum', () => ({
  TokenStandard: { NonFungible: 0 },
  TokenProgramVersion: { Original: 0 },
  mintV1: jest.fn(),
  mintV2: jest.fn().mockReturnValue({
    sendAndConfirm: jest.fn().mockResolvedValue({
      signature: new Uint8Array([1, 2, 3, 4]),
    }),
  }),
  parseLeafFromMintV2Transaction: jest.fn().mockResolvedValue({
    id: { toString: () => MOCK_TOKEN_ADDRESS },
  }),
}));

jest.mock('@metaplex-foundation/umi', () => ({
  publicKey: jest.fn((value: string) => value),
}));

jest.mock('bs58', () => ({
  default: { encode: jest.fn(() => MOCK_TX_HASH) },
  encode: jest.fn(() => MOCK_TX_HASH),
}));

jest.mock('../umi.client', () => ({
  createUmiClient: jest.fn(() => ({
    identity: { publicKey: 'treasury-pubkey' },
  })),
}));

function makeBatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'batch-uuid',
    code: 'AGP-2026-0001',
    publicCode: 'AGP-2026-0001',
    status: BatchStatus.CREATED,
    tokenAddress: null,
    tokenizedAt: null,
    farm: {
      id: 'farm-uuid',
      name: 'Fazenda Teste',
      producer: { id: 'producer-uuid', name: 'Joao' },
    },
    ...overrides,
  };
}

describe('BubblegumService', () => {
  let service: BubblegumService;
  let batchFindUnique: jest.Mock;
  let batchUpdate: jest.Mock;
  let batchFindUniqueOrThrow: jest.Mock;
  let appendEvent: jest.Mock;

  beforeEach(async () => {
    batchFindUnique = jest.fn();
    batchUpdate = jest.fn();
    batchFindUniqueOrThrow = jest.fn();
    appendEvent = jest.fn();
    process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
    process.env.SOLANA_TREASURY_KEYPAIR_PATH = '/path/keypair.json';
    process.env.SOLANA_MERKLE_TREE = 'TreeAddress123';

    const module = await Test.createTestingModule({
      providers: [
        BubblegumService,
        {
          provide: PrismaService,
          useValue: {
            batch: { findUnique: batchFindUnique, update: batchUpdate },
            $transaction: jest.fn((callback) =>
              callback({
                batch: {
                  update: batchUpdate,
                  findUniqueOrThrow: batchFindUniqueOrThrow,
                },
              }),
            ),
          },
        },
        {
          provide: EventChainService,
          useValue: { lockBatch: jest.fn(), appendInTransaction: appendEvent },
        },
      ],
    }).compile();

    service = module.get(BubblegumService);
  });

  afterEach(() => {
    delete process.env.SOLANA_RPC_URL;
    delete process.env.SOLANA_TREASURY_KEYPAIR_PATH;
    delete process.env.SOLANA_MERKLE_TREE;
    delete process.env.PUBLIC_BACKEND_URL;
  });

  it('rejeita lote inexistente', async () => {
    batchFindUnique.mockResolvedValue(null);
    await expect(
      service.mintBatchCnft('x', AUTH_USER as never),
    ).rejects.toThrow(NotFoundException);
  });

  it.each([BatchStatus.CLOSED, BatchStatus.CANCELLED])(
    'rejeita tokenizacao de lote %s',
    async (status) => {
      batchFindUnique.mockResolvedValue(makeBatch({ status }));
      await expect(
        service.mintBatchCnft('batch-uuid', AUTH_USER as never),
      ).rejects.toThrow(BadRequestException);
    },
  );

  it('rejeita lote ja tokenizado', async () => {
    batchFindUnique.mockResolvedValue(
      makeBatch({ tokenAddress: 'existing-token' }),
    );
    await expect(
      service.mintBatchCnft('batch-uuid', AUTH_USER as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('persiste token e registra o evento on-chain', async () => {
    batchFindUnique.mockResolvedValue(makeBatch());
    batchUpdate.mockResolvedValue(
      makeBatch({ tokenAddress: MOCK_TOKEN_ADDRESS, tokenizedAt: new Date() }),
    );
    batchFindUniqueOrThrow.mockResolvedValue(
      makeBatch({ tokenAddress: MOCK_TOKEN_ADDRESS, tokenizedAt: new Date() }),
    );

    const result = await service.mintBatchCnft(
      'batch-uuid',
      AUTH_USER as never,
    );

    expect(result.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
    expect(result.metadataUri).toContain(
      '/public/batches/AGP-2026-0001/metadata.json',
    );
    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenAddress: MOCK_TOKEN_ADDRESS,
          tokenizedAt: expect.any(Date),
        }),
      }),
    );
    expect(appendEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'MINTED_ONCHAIN',
        txHash: MOCK_TX_HASH,
        recordedById: 'admin-uuid',
      }),
    );
  });
});
