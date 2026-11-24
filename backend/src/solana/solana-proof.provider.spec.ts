import { mintV1, mintV2 } from '@metaplex-foundation/mpl-bubblegum';
import { NonRetryableProofError } from '../blockchain/blockchain-proof.provider';
import {
  buildProofMemo,
  parseProofMemos,
  SolanaProofProvider,
} from './solana-proof.provider';

const CHAIN_HASH = 'd'.repeat(64);
const sentMemos: string[] = [];
const getSignaturesForAddress = jest.fn();

function mintBuilder() {
  return {
    add: jest.fn((memo: { memo: string }) => {
      sentMemos.push(memo.memo);
      return {
        sendAndConfirm: jest
          .fn()
          .mockResolvedValue({ signature: new Uint8Array([1, 2, 3]) }),
      };
    }),
  };
}

jest.mock('@metaplex-foundation/mpl-bubblegum', () => ({
  TokenStandard: { NonFungible: 0 },
  TokenProgramVersion: { Original: 0 },
  mintV1: jest.fn(() => mintBuilder()),
  mintV2: jest.fn(() => mintBuilder()),
  parseLeafFromMintV1Transaction: jest.fn().mockRejectedValue(new Error('v1')),
  parseLeafFromMintV2Transaction: jest
    .fn()
    .mockResolvedValue({ id: { toString: () => 'asset-id' } }),
}));

// The memo builder is reduced to the text it carries.
jest.mock('@metaplex-foundation/umi', () => ({
  publicKey: jest.fn((value: string) => value),
  transactionBuilder: () => ({
    add: (item: { instruction: { data: Uint8Array } }) => ({
      memo: new TextDecoder().decode(item.instruction.data),
    }),
  }),
}));

jest.mock('@solana/web3.js', () => ({
  clusterApiUrl: (network: string) => `https://api.${network}.solana.com`,
  Connection: jest.fn(() => ({ getSignaturesForAddress })),
  PublicKey: jest.fn((value: string) => value),
}));

jest.mock('bs58', () => ({
  __esModule: true,
  default: {
    encode: jest.fn(() => 'tx-base58'),
    decode: jest.fn(() => new Uint8Array([1, 2, 3])),
  },
}));

jest.mock('./umi.client', () => ({
  createUmiClient: jest.fn(() => ({
    identity: { publicKey: { toString: () => 'Treasury111' } },
  })),
}));

const request = {
  batchId: 'batch-uuid',
  batchCode: 'AGP-2026-0001',
  publicCode: 'AGP-2026-0001',
  chainHash: CHAIN_HASH,
  metadataUri:
    'https://api.agropass.com.br/public/batches/AGP-2026-0001/metadata.json',
};

function makeProvider(overrides = {}) {
  return new SolanaProofProvider({
    network: 'devnet',
    keypairPath: './keys/treasury.json',
    merkleTree: 'Tree111',
    ...overrides,
  });
}

describe('SolanaProofProvider', () => {
  beforeEach(() => {
    sentMemos.length = 0;
    jest.clearAllMocks();
  });

  it('minta o cNFT com o hash final da cadeia no memo da transacao', async () => {
    const receipt = await makeProvider().register(request);

    expect(sentMemos).toEqual([buildProofMemo('AGP-2026-0001', CHAIN_HASH)]);
    expect(sentMemos[0]).toContain(CHAIN_HASH);
    expect(receipt).toMatchObject({
      network: 'devnet',
      txHash: 'tx-base58',
      tokenAddress: 'asset-id',
      anchoredHash: CHAIN_HASH,
    });
  });

  it('usa mintV1 quando a arvore nao suporta a versao 2', async () => {
    (mintV2 as jest.Mock).mockImplementationOnce(() => ({
      add: () => ({
        sendAndConfirm: jest
          .fn()
          .mockRejectedValue(new Error('Unsupported schema version')),
      }),
    }));

    await expect(makeProvider().register(request)).resolves.toMatchObject({
      txHash: 'tx-base58',
    });
    expect(mintV1).toHaveBeenCalled();
    expect(sentMemos).toEqual([buildProofMemo('AGP-2026-0001', CHAIN_HASH)]);
  });

  it('encontra prova ja registrada pelo memo, ignorando transacoes com erro', async () => {
    getSignaturesForAddress.mockResolvedValue([
      {
        signature: 'failed-tx',
        err: { code: 1 },
        memo: `[90] ${buildProofMemo('AGP-2026-0001', CHAIN_HASH)}`,
      },
      {
        signature: 'other-batch',
        err: null,
        memo: `[90] ${buildProofMemo('AGP-2026-0002', CHAIN_HASH)}`,
      },
      {
        signature: 'proof-tx',
        err: null,
        blockTime: 1_767_225_600,
        memo: `[90] ${buildProofMemo('AGP-2026-0001', CHAIN_HASH)}`,
      },
    ]);

    const receipt = await makeProvider().findExisting(request);

    expect(receipt).toMatchObject({
      txHash: 'proof-tx',
      anchoredHash: CHAIN_HASH,
      anchoredAt: new Date(1_767_225_600 * 1000),
    });
  });

  it('retorna null quando o lote ainda nao tem prova', async () => {
    getSignaturesForAddress.mockResolvedValue([
      { signature: 'x', err: null, memo: null },
    ]);
    await expect(makeProvider().findExisting(request)).resolves.toBeNull();
  });

  it('identifica falha de rede como erro de comunicacao com a Solana, repetivel', async () => {
    getSignaturesForAddress.mockRejectedValue(new Error('fetch failed'));

    const failure = makeProvider().findExisting(request);
    await expect(failure).rejects.toThrow(
      'Falha na comunicacao com a Solana (devnet): fetch failed',
    );
    await expect(failure).rejects.not.toBeInstanceOf(NonRetryableProofError);
  });

  it('trata configuracao ausente ou invalida como erro definitivo', async () => {
    await expect(
      makeProvider({ merkleTree: '' }).register(request),
    ).rejects.toThrow(NonRetryableProofError);
    await expect(
      makeProvider({ keypairPath: undefined }).register(request),
    ).rejects.toThrow(NonRetryableProofError);
    await expect(
      makeProvider({ network: 'devnett' }).findExisting(request),
    ).rejects.toThrow(NonRetryableProofError);
  });
});

describe('parseProofMemos', () => {
  it('le os memos no formato retornado pelo RPC', () => {
    const raw = `[5] hello; [90] ${buildProofMemo('AGP-2026-0001', CHAIN_HASH)}`;
    expect(parseProofMemos(raw)).toEqual([
      { publicCode: 'AGP-2026-0001', chainHash: CHAIN_HASH },
    ]);
    expect(parseProofMemos(null)).toEqual([]);
  });
});
