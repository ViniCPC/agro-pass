import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { BubblegumService } from './bubblegum.service';

const MOCK_TX_BYTES = new Uint8Array([1, 2, 3, 4]);
const MOCK_TX_HASH = 'mock-tx-hash-base58';
const MOCK_CNFT_ADDRESS = 'mock-cnft-address';

jest.mock('@metaplex-foundation/mpl-bubblegum', () => ({
  mintV2: jest.fn().mockReturnValue({
    sendAndConfirm: jest.fn().mockResolvedValue({ signature: new Uint8Array([1, 2, 3, 4]) }),
  }),
  parseLeafFromMintV2Transaction: jest.fn().mockResolvedValue({
    id: { toString: () => MOCK_CNFT_ADDRESS },
  }),
}));

jest.mock('@metaplex-foundation/umi', () => ({
  publicKey: jest.fn((v: string) => v),
  none: jest.fn(() => null),
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
    code: 'CAF-2026-0001',
    cnftAddress: null,
    mintTxHash: null,
    farm: {
      id: 'farm-uuid',
      name: 'Fazenda Test',
      producer: { id: 'producer-uuid', name: 'João' },
    },
    ...overrides,
  };
}

describe('BubblegumService', () => {
  let service: BubblegumService;
  let batchFindUnique: jest.Mock;
  let batchUpdate: jest.Mock;

  const ENV_VARS = {
    SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    SOLANA_TREASURY_KEYPAIR_PATH: '/path/to/keypair.json',
    SOLANA_MERKLE_TREE: 'TreeAddress123',
  };

  beforeEach(async () => {
    batchFindUnique = jest.fn();
    batchUpdate = jest.fn();

    Object.entries(ENV_VARS).forEach(([k, v]) => { process.env[k] = v; });

    const module = await Test.createTestingModule({
      providers: [
        BubblegumService,
        {
          provide: PrismaService,
          useValue: { batch: { findUnique: batchFindUnique, update: batchUpdate } },
        },
      ],
    }).compile();

    service = module.get(BubblegumService);
  });

  afterEach(() => {
    Object.keys(ENV_VARS).forEach((k) => delete process.env[k]);
  });

  // ─── guard clauses ────────────────────────────────────────────────────────

  it('lança NotFoundException quando o lote não existe', async () => {
    batchFindUnique.mockResolvedValue(null);

    await expect(service.mintBatchCnft('x')).rejects.toThrow(NotFoundException);
  });

  it('lança BadRequestException quando lote já foi mintado (cnftAddress)', async () => {
    batchFindUnique.mockResolvedValue(makeBatch({ cnftAddress: 'existing-address' }));

    await expect(service.mintBatchCnft('batch-uuid')).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequestException quando lote já foi mintado (mintTxHash)', async () => {
    batchFindUnique.mockResolvedValue(makeBatch({ mintTxHash: 'existing-tx' }));

    await expect(service.mintBatchCnft('batch-uuid')).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequestException quando SOLANA_RPC_URL não está configurado', async () => {
    delete process.env.SOLANA_RPC_URL;
    batchFindUnique.mockResolvedValue(makeBatch());

    await expect(service.mintBatchCnft('batch-uuid')).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequestException quando SOLANA_MERKLE_TREE não está configurado', async () => {
    delete process.env.SOLANA_MERKLE_TREE;
    batchFindUnique.mockResolvedValue(makeBatch());

    await expect(service.mintBatchCnft('batch-uuid')).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequestException quando SOLANA_MERKLE_TREE é o valor placeholder', async () => {
    process.env.SOLANA_MERKLE_TREE = 'ENDERECO_DA_TREE_AQUI';
    batchFindUnique.mockResolvedValue(makeBatch());

    await expect(service.mintBatchCnft('batch-uuid')).rejects.toThrow(BadRequestException);
  });

  // ─── happy path ───────────────────────────────────────────────────────────

  it('retorna resultado com batchId, batchCode, cnftAddress e mintTxHash', async () => {
    batchFindUnique.mockResolvedValue(makeBatch());
    batchUpdate.mockResolvedValue({
      id: 'batch-uuid',
      code: 'CAF-2026-0001',
      cnftAddress: MOCK_CNFT_ADDRESS,
      metadataUri: 'https://mock/metadata.json',
      mintTxHash: MOCK_TX_HASH,
      merkleTree: 'TreeAddress123',
    });

    const result = await service.mintBatchCnft('batch-uuid');

    expect(result.batchId).toBe('batch-uuid');
    expect(result.batchCode).toBe('CAF-2026-0001');
    expect(result.mintTxHash).toBe(MOCK_TX_HASH);
    expect(result.merkleTree).toBe('TreeAddress123');
  });

  it('persiste cnftAddress, metadataUri, mintTxHash e merkleTree no banco', async () => {
    batchFindUnique.mockResolvedValue(makeBatch());
    batchUpdate.mockResolvedValue({ id: 'batch-uuid', code: 'CAF-2026-0001' });

    await service.mintBatchCnft('batch-uuid');

    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'batch-uuid' },
        data: expect.objectContaining({
          mintTxHash: MOCK_TX_HASH,
          merkleTree: 'TreeAddress123',
        }),
      }),
    );
  });

  it('usa PUBLIC_BACKEND_URL na metadataUri quando configurado', async () => {
    process.env.PUBLIC_BACKEND_URL = 'https://api.agropass.com.br';
    batchFindUnique.mockResolvedValue(makeBatch());
    batchUpdate.mockResolvedValue({ id: 'batch-uuid', code: 'CAF-2026-0001' });

    await service.mintBatchCnft('batch-uuid');

    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadataUri: 'https://api.agropass.com.br/public/batches/CAF-2026-0001/metadata.json',
        }),
      }),
    );
    delete process.env.PUBLIC_BACKEND_URL;
  });
});
