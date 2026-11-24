import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BatchStatus, TokenizationStatus } from '../../generated/prisma/enums';
import { EventChainService } from '../event-chain/event-chain.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BLOCKCHAIN_PROOF_PROVIDER,
  NonRetryableProofError,
  type BlockchainProofProvider,
  type ProofReceipt,
  type ProofRequest,
} from './blockchain-proof.provider';
import { BLOCKCHAIN_CONFIG, type BlockchainConfig } from './blockchain.config';
import { explorerAddressUrl, explorerTxUrl } from './explorer';

const DEV_PUBLIC_BACKEND_URL = 'http://localhost:3000';

const TOKENIZATION_SELECT = {
  id: true,
  code: true,
  publicCode: true,
  status: true,
  integrityHash: true,
  tokenizationStatus: true,
  tokenizationAttempts: true,
  tokenizationError: true,
  proofHash: true,
  tokenAddress: true,
  tokenTxHash: true,
  tokenizedAt: true,
  blockchainNetwork: true,
} as const;

type TokenizationRecord = {
  id: string;
  tokenizationStatus: TokenizationStatus;
  tokenizationAttempts: number;
  tokenizationError: string | null;
  proofHash: string | null;
  tokenAddress: string | null;
  tokenTxHash: string | null;
  tokenizedAt: Date | null;
  blockchainNetwork: string | null;
};

export interface TokenizationResult {
  batchId: string;
  status: TokenizationStatus;
  network: string | null;
  proofHash: string | null;
  tokenAddress: string | null;
  txHash: string | null;
  tokenizedAt: Date | null;
  attempts: number;
  error: string | null;
  explorerTxUrl: string | null;
  explorerTokenUrl: string | null;
}

function toResult(record: TokenizationRecord): TokenizationResult {
  return {
    batchId: record.id,
    status: record.tokenizationStatus,
    network: record.blockchainNetwork,
    proofHash: record.proofHash,
    tokenAddress: record.tokenAddress,
    txHash: record.tokenTxHash,
    tokenizedAt: record.tokenizedAt,
    attempts: record.tokenizationAttempts,
    error: record.tokenizationError,
    explorerTxUrl: explorerTxUrl(record.blockchainNetwork, record.tokenTxHash),
    explorerTokenUrl: explorerAddressUrl(
      record.blockchainNetwork,
      record.tokenAddress,
    ),
  };
}

function describe(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// One cNFT per batch, registered after closing with the final chain hash.
// The proof lives on the batch row: the closed chain itself is never touched,
// so a blockchain failure cannot corrupt the batch.
@Injectable()
export class BatchTokenizationService {
  private readonly logger = new Logger(BatchTokenizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventChain: EventChainService,
    @Inject(BLOCKCHAIN_PROOF_PROVIDER)
    private readonly provider: BlockchainProofProvider,
    @Inject(BLOCKCHAIN_CONFIG) private readonly config: BlockchainConfig,
  ) {}

  get enabled() {
    return this.config.enabled;
  }

  // Called right after a batch is closed. Runs in the background and never
  // throws: closing succeeds whatever happens on-chain, and a failure stays
  // recorded on the batch for a manual retry.
  scheduleAfterClose(batchId: string): void {
    if (!this.config.enabled) return;

    void this.tokenize(batchId).catch((error: unknown) => {
      this.logger.warn(
        `Prova do lote ${batchId} nao registrada: ${describe(error)}`,
      );
    });
  }

  // Idempotent: a confirmed batch returns its existing proof and never mints
  // again.
  async tokenize(batchId: string): Promise<TokenizationResult> {
    if (!this.config.enabled) {
      throw new ServiceUnavailableException(
        'Registro em blockchain desabilitado (BLOCKCHAIN_ENABLED=false).',
      );
    }

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: TOKENIZATION_SELECT,
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    if (batch.tokenizationStatus === TokenizationStatus.CONFIRMED) {
      return toResult(batch);
    }

    if (batch.status !== BatchStatus.CLOSED || !batch.integrityHash) {
      throw new BadRequestException(
        'Apenas lotes encerrados podem ser registrados na blockchain.',
      );
    }

    if (!(await this.claim(batchId))) {
      throw new ConflictException(
        'O registro deste lote ja esta em andamento.',
      );
    }

    const request: ProofRequest = {
      batchId,
      batchCode: batch.code,
      publicCode: batch.publicCode,
      chainHash: batch.integrityHash,
      metadataUri: '',
    };

    try {
      request.metadataUri = this.metadataUri(batch.publicCode);

      // Anchoring a tampered chain would certify the tampering.
      const integrity = await this.eventChain.verify(batchId);
      if (!integrity.valid) {
        throw new NonRetryableProofError(
          'A cadeia de eventos nao esta integra; a prova nao foi registrada.',
        );
      }

      const receipt = await this.registerWithRetry(request);
      if (receipt.anchoredHash !== request.chainHash) {
        throw new NonRetryableProofError(
          `Ja existe prova on-chain deste lote com outro hash (${receipt.anchoredHash}).`,
        );
      }

      const confirmed = await this.prisma.batch.update({
        where: { id: batchId },
        data: {
          tokenizationStatus: TokenizationStatus.CONFIRMED,
          tokenizationError: null,
          proofHash: receipt.anchoredHash,
          tokenAddress: receipt.tokenAddress,
          tokenTxHash: receipt.txHash,
          tokenizedAt: receipt.anchoredAt,
          blockchainNetwork: receipt.network,
        },
        select: TOKENIZATION_SELECT,
      });

      this.logger.log(
        `Prova do lote ${batch.code} registrada: ${receipt.txHash}`,
      );
      return toResult(confirmed);
    } catch (error) {
      const reason = describe(error);
      await this.prisma.batch.update({
        where: { id: batchId },
        data: {
          tokenizationStatus: TokenizationStatus.FAILED,
          tokenizationError: reason.slice(0, 500),
        },
      });

      throw new ServiceUnavailableException(
        `Nao foi possivel registrar a prova na blockchain (${reason}). O lote nao foi alterado e o registro pode ser tentado novamente.`,
      );
    }
  }

  // Atomic claim: only one worker registers a batch at a time. A PENDING
  // claim older than the timeout belongs to a crashed worker and is taken
  // over; findExisting() then picks up anything that worker already minted.
  private async claim(batchId: string): Promise<boolean> {
    const staleBefore = new Date(Date.now() - this.config.pendingTimeoutMs);
    const { count } = await this.prisma.batch.updateMany({
      where: {
        id: batchId,
        status: BatchStatus.CLOSED,
        OR: [
          {
            tokenizationStatus: {
              in: [TokenizationStatus.NONE, TokenizationStatus.FAILED],
            },
          },
          {
            tokenizationStatus: TokenizationStatus.PENDING,
            tokenizationStartedAt: { lt: staleBefore },
          },
        ],
      },
      data: {
        tokenizationStatus: TokenizationStatus.PENDING,
        tokenizationStartedAt: new Date(),
        tokenizationError: null,
      },
    });

    return count === 1;
  }

  // Every attempt first looks for a proof already on-chain, so retrying after
  // a lost response or timeout does not mint a second token.
  private async registerWithRetry(
    request: ProofRequest,
  ): Promise<ProofReceipt> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt += 1) {
      await this.prisma.batch.update({
        where: { id: request.batchId },
        data: { tokenizationAttempts: { increment: 1 } },
      });

      try {
        return (
          (await this.provider.findExisting(request)) ??
          (await this.provider.register(request))
        );
      } catch (error) {
        lastError = error;
        if (error instanceof NonRetryableProofError) break;
        if (attempt < this.config.maxAttempts) {
          this.logger.warn(
            `Tentativa ${attempt} de registrar ${request.batchCode} falhou: ${describe(error)}`,
          );
          await sleep(this.config.retryDelayMs * 2 ** (attempt - 1));
        }
      }
    }

    throw lastError;
  }

  // The URI is written into an immutable cNFT, so production refuses to fall
  // back to localhost.
  private metadataUri(publicCode: string) {
    const configured = process.env.PUBLIC_BACKEND_URL?.trim().replace(
      /\/+$/,
      '',
    );
    if (!configured && process.env.NODE_ENV === 'production') {
      throw new NonRetryableProofError('PUBLIC_BACKEND_URL nao configurado.');
    }
    const base = configured || DEV_PUBLIC_BACKEND_URL;
    return `${base}/public/batches/${encodeURIComponent(publicCode)}/metadata.json`;
  }
}
