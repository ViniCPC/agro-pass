import { Inject, Injectable, Logger } from '@nestjs/common';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import {
  BLOCKCHAIN_CONFIG,
  isSolanaNetwork,
  type BlockchainConfig,
} from '../blockchain/blockchain.config';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_SOLANA_TIMEOUT_MS = 3_000;
const SOLANA_HEALTH_ENABLED_ENV = 'HEALTHCHECK_SOLANA_ENABLED';

export type HealthStatus = 'ok' | 'degraded';
export type ServiceHealthStatus = 'ok' | 'error';

export type ServiceHealth = {
  status: ServiceHealthStatus;
  message?: string;
  version?: unknown;
};

export type HealthCheckResult = {
  status: HealthStatus;
  uptimeSeconds: number;
  responseTimeMs: number;
  services: {
    database: ServiceHealth;
    solana: ServiceHealth;
  };
  checkedAt: string;
};

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private solanaConnection: Connection | null = null;
  private solanaRpcUrl: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(BLOCKCHAIN_CONFIG) private readonly blockchain: BlockchainConfig,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    const [database, solana] = await Promise.all([
      this.checkDatabase(),
      this.checkSolana(),
    ]);

    return {
      status:
        database.status === 'ok' && solana.status === 'ok' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      services: {
        database,
        solana,
      },
      checkedAt: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      await this.withTimeout(
        this.prisma.$queryRaw`SELECT 1`,
        3000,
        'Database health check timed out',
      );

      return {
        status: 'ok',
      };
    } catch {
      this.logger.warn('Database health check failed');

      return {
        status: 'error',
        message: 'Banco de dados indisponivel.',
      };
    }
  }

  private async checkSolana(): Promise<ServiceHealth> {
    if (!this.blockchain.enabled) {
      return {
        status: 'ok',
        message: 'BLOCKCHAIN_ENABLED=false (check ignorado)',
      };
    }

    if (this.blockchain.provider === 'local') {
      return { status: 'ok', message: 'Provider local (sem rede)' };
    }

    if (!this.isSolanaHealthCheckEnabled()) {
      return {
        status: 'ok',
        message: `${SOLANA_HEALTH_ENABLED_ENV}=false (check ignorado)`,
      };
    }

    const rpcUrl =
      process.env.SOLANA_RPC_URL?.trim() ||
      (isSolanaNetwork(this.blockchain.network)
        ? clusterApiUrl(this.blockchain.network)
        : null);

    if (!rpcUrl) {
      return {
        status: 'error',
        message: `BLOCKCHAIN_NETWORK invalida: ${this.blockchain.network}`,
      };
    }

    try {
      const timeoutMs = this.readTimeoutEnv(
        'HEALTH_SOLANA_TIMEOUT_MS',
        DEFAULT_SOLANA_TIMEOUT_MS,
      );
      const version = await this.withTimeout(
        this.getSolanaConnection(rpcUrl).getVersion(),
        timeoutMs,
        'Solana RPC health check timed out',
      );

      return {
        status: 'ok',
        version,
      };
    } catch {
      this.logger.warn('Solana health check failed');

      return {
        status: 'error',
        message: 'Solana RPC indisponivel.',
      };
    }
  }

  private getSolanaConnection(rpcUrl: string): Connection {
    if (!this.solanaConnection || this.solanaRpcUrl !== rpcUrl) {
      this.solanaConnection = new Connection(rpcUrl, 'confirmed');
      this.solanaRpcUrl = rpcUrl;
    }

    return this.solanaConnection;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error(timeoutMessage)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private readTimeoutEnv(key: string, fallback: number): number {
    const rawValue = Number(process.env[key]);
    return Number.isInteger(rawValue) && rawValue > 0 ? rawValue : fallback;
  }

  private isSolanaHealthCheckEnabled(): boolean {
    const rawValue = process.env[SOLANA_HEALTH_ENABLED_ENV];

    if (!rawValue) {
      return true;
    }

    const normalized = rawValue.trim().toLowerCase();
    return !['false', '0', 'off', 'no'].includes(normalized);
  }
}
