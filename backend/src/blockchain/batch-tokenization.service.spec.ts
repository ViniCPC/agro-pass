import {
  BadRequestException,
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventChainService } from '../event-chain/event-chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { BatchTokenizationService } from './batch-tokenization.service';
import {
  BLOCKCHAIN_PROOF_PROVIDER,
  NonRetryableProofError,
} from './blockchain-proof.provider';
import { BLOCKCHAIN_CONFIG, type BlockchainConfig } from './blockchain.config';
import { LocalProofProvider } from './local-proof.provider';

const CHAIN_HASH = 'a'.repeat(64);

type Row = Record<string, unknown> & {
  id: string;
  status: string;
  integrityHash: string | null;
  tokenizationStatus: string;
  tokenizationAttempts: number;
  tokenizationStartedAt: Date | null;
};

function makeRow(overrides: Partial<Row> = {}): Row {
  return {
    id: 'batch-uuid',
    code: 'AGP-2026-0001',
    publicCode: 'AGP-2026-0001',
    status: 'CLOSED',
    integrityHash: CHAIN_HASH,
    tokenizationStatus: 'NONE',
    tokenizationAttempts: 0,
    tokenizationStartedAt: null,
    tokenizationError: null,
    proofHash: null,
    tokenAddress: null,
    tokenTxHash: null,
    tokenizedAt: null,
    blockchainNetwork: null,
    ...overrides,
  };
}

// Keeps the batch row in memory and honours the conditional update used by
// the claim, so state transitions are exercised for real.
function fakePrisma(row: Row) {
  const apply = (data: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(data)) {
      row[key] =
        value && typeof value === 'object' && 'increment' in value
          ? (row[key] as number) + (value as { increment: number }).increment
          : value;
    }
  };

  type Condition = {
    tokenizationStatus: string | { in: string[] };
    tokenizationStartedAt?: { lt: Date };
  };
  const matches = (where: { id: string; status?: string; OR?: Condition[] }) =>
    where.id === row.id &&
    (!where.status || where.status === row.status) &&
    (!where.OR ||
      where.OR.some((condition) => {
        const status = condition.tokenizationStatus;
        if (typeof status === 'object')
          return status.in.includes(row.tokenizationStatus);
        if (status !== row.tokenizationStatus) return false;
        const limit = condition.tokenizationStartedAt?.lt;
        return (
          !limit ||
          (row.tokenizationStartedAt !== null &&
            row.tokenizationStartedAt < limit)
        );
      }));

  return {
    batch: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id === row.id ? { ...row } : null),
      ),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: Parameters<typeof matches>[0];
          data: Record<string, unknown>;
        }) => {
          if (!matches(where)) return Promise.resolve({ count: 0 });
          apply(data);
          return Promise.resolve({ count: 1 });
        },
      ),
      update: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        apply(data);
        return Promise.resolve({ ...row });
      }),
    },
  };
}

const CONFIG: BlockchainConfig = {
  enabled: true,
  provider: 'local',
  network: 'local',
  maxAttempts: 3,
  retryDelayMs: 1,
  pendingTimeoutMs: 60_000,
};

async function setup(
  rowOverrides: Partial<Row> = {},
  config: Partial<BlockchainConfig> = {},
) {
  const row = makeRow(rowOverrides);
  const provider = new LocalProofProvider();
  const verify = jest
    .fn()
    .mockResolvedValue({ valid: true, finalHash: row.integrityHash });

  const module = await Test.createTestingModule({
    providers: [
      BatchTokenizationService,
      { provide: PrismaService, useValue: fakePrisma(row) },
      { provide: EventChainService, useValue: { verify } },
      { provide: BLOCKCHAIN_PROOF_PROVIDER, useValue: provider },
      { provide: BLOCKCHAIN_CONFIG, useValue: { ...CONFIG, ...config } },
    ],
  }).compile();

  return {
    service: module.get(BatchTokenizationService),
    row,
    provider,
    verify,
    register: jest.spyOn(provider, 'register'),
    findExisting: jest.spyOn(provider, 'findExisting'),
  };
}

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 100 && !condition(); i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

describe('BatchTokenizationService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('registra o hash final e salva endereco, transacao e horario', async () => {
    const { service, row, register } = await setup();

    const result = await service.tokenize('batch-uuid');

    // The hash sent on-chain is the hash stored and shown on the passport.
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ chainHash: CHAIN_HASH }),
    );
    expect(result).toMatchObject({
      status: 'CONFIRMED',
      proofHash: CHAIN_HASH,
      network: 'local',
      attempts: 1,
    });
    // Address, transaction and time are all saved.
    expect(result.txHash).toMatch(/^local-tx-/);
    expect(result.tokenAddress).toMatch(/^local-token-/);
    expect(result.tokenizedAt).toBeInstanceOf(Date);
    expect(row).toMatchObject({
      proofHash: CHAIN_HASH,
      status: 'CLOSED',
      integrityHash: CHAIN_HASH,
    });
  });

  it('nunca tokeniza o mesmo lote duas vezes', async () => {
    const { service, register } = await setup();

    const first = await service.tokenize('batch-uuid');
    const second = await service.tokenize('batch-uuid');

    expect(second.txHash).toBe(first.txHash);
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('chamadas concorrentes geram um unico mint', async () => {
    const { service, register } = await setup();

    const results = await Promise.allSettled([
      service.tokenize('batch-uuid'),
      service.tokenize('batch-uuid'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected');
    expect(rejected?.reason).toBeInstanceOf(ConflictException);
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('repete apos falha transitoria, consultando a rede antes de cada tentativa', async () => {
    const { service, row, register, findExisting } = await setup();
    register.mockRejectedValueOnce(new Error('RPC timeout'));

    const result = await service.tokenize('batch-uuid');

    expect(result.status).toBe('CONFIRMED');
    expect(row.tokenizationAttempts).toBe(2);
    expect(findExisting).toHaveBeenCalledTimes(2);
  });

  it('falha na Solana nao corrompe o lote e fica registrada', async () => {
    const { service, row, register } = await setup();
    register.mockRejectedValue(new Error('Solana indisponivel'));

    await expect(service.tokenize('batch-uuid')).rejects.toThrow(
      ServiceUnavailableException,
    );

    expect(register).toHaveBeenCalledTimes(3);
    expect(row).toMatchObject({
      status: 'CLOSED',
      integrityHash: CHAIN_HASH,
      tokenizationStatus: 'FAILED',
      tokenizationAttempts: 3,
      tokenizationError: 'Solana indisponivel',
      proofHash: null,
      tokenTxHash: null,
    });
  });

  it('nao repete erro de configuracao', async () => {
    const { service, row, register } = await setup();
    register.mockRejectedValue(
      new NonRetryableProofError('SOLANA_MERKLE_TREE nao foi configurado.'),
    );

    await expect(service.tokenize('batch-uuid')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(register).toHaveBeenCalledTimes(1);
    expect(row.tokenizationStatus).toBe('FAILED');
  });

  it('nova tentativa apos falha confirma a prova', async () => {
    const { service, register } = await setup();
    register.mockRejectedValue(new Error('Solana indisponivel'));
    await expect(service.tokenize('batch-uuid')).rejects.toThrow();

    register.mockRestore();
    await expect(service.tokenize('batch-uuid')).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
  });

  it('reaproveita prova ja registrada na rede (queda apos o mint)', async () => {
    const { service, register, findExisting } = await setup();
    findExisting.mockResolvedValue({
      network: 'local',
      txHash: 'tx-already-on-chain',
      tokenAddress: 'asset-1',
      anchoredHash: CHAIN_HASH,
      anchoredAt: new Date('2026-01-01T00:00:00Z'),
    });

    const result = await service.tokenize('batch-uuid');

    expect(register).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'CONFIRMED',
      txHash: 'tx-already-on-chain',
    });
  });

  it('recusa prova existente com outro hash', async () => {
    const { service, row, findExisting } = await setup();
    findExisting.mockResolvedValue({
      network: 'local',
      txHash: 'tx-old',
      tokenAddress: null,
      anchoredHash: 'b'.repeat(64),
      anchoredAt: new Date(),
    });

    await expect(service.tokenize('batch-uuid')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(row).toMatchObject({
      tokenizationStatus: 'FAILED',
      proofHash: null,
    });
  });

  it('nao ancora uma cadeia adulterada', async () => {
    const { service, row, verify, register } = await setup();
    verify.mockResolvedValue({ valid: false });

    await expect(service.tokenize('batch-uuid')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(register).not.toHaveBeenCalled();
    expect(row.tokenizationStatus).toBe('FAILED');
  });

  it('exige lote encerrado', async () => {
    const { service, row } = await setup({ status: 'DELIVERED' });

    await expect(service.tokenize('batch-uuid')).rejects.toThrow(
      BadRequestException,
    );
    expect(row.tokenizationStatus).toBe('NONE');
  });

  it('retoma registro PENDING abandonado, mas nao um em andamento', async () => {
    const recent = await setup({
      tokenizationStatus: 'PENDING',
      tokenizationStartedAt: new Date(),
    });
    await expect(recent.service.tokenize('batch-uuid')).rejects.toThrow(
      ConflictException,
    );

    const stale = await setup({
      tokenizationStatus: 'PENDING',
      tokenizationStartedAt: new Date(Date.now() - 10 * 60_000),
    });
    await expect(stale.service.tokenize('batch-uuid')).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
  });

  it('com a blockchain desabilitada nada e enviado', async () => {
    const { service, register } = await setup({}, { enabled: false });

    service.scheduleAfterClose('batch-uuid');
    await expect(service.tokenize('batch-uuid')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(register).not.toHaveBeenCalled();
  });

  it('agendamento apos encerrar nunca lanca, mesmo com a rede fora', async () => {
    const { service, row, register } = await setup();
    register.mockRejectedValue(new Error('Solana indisponivel'));

    expect(() => service.scheduleAfterClose('batch-uuid')).not.toThrow();
    await waitFor(() => row.tokenizationStatus === 'FAILED');

    expect(row).toMatchObject({
      tokenizationStatus: 'FAILED',
      status: 'CLOSED',
    });
  });
});
