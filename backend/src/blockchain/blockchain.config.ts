export const BLOCKCHAIN_CONFIG = Symbol('BLOCKCHAIN_CONFIG');

export const SOLANA_NETWORKS = ['devnet', 'testnet', 'mainnet-beta'] as const;
export type SolanaNetwork = (typeof SOLANA_NETWORKS)[number];
export type BlockchainProviderName = 'solana' | 'local';

export interface BlockchainConfig {
  // Off by default: the passport works fully without any blockchain.
  enabled: boolean;
  provider: BlockchainProviderName;
  network: string;
  maxAttempts: number;
  retryDelayMs: number;
  // A PENDING claim older than this is considered abandoned (crashed worker)
  // and may be retried; the on-chain lookup still prevents a second mint.
  pendingTimeoutMs: number;
}

export function isSolanaNetwork(value: string | null): value is SolanaNetwork {
  return SOLANA_NETWORKS.includes(value as SolanaNetwork);
}

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeNetwork(value: string | undefined) {
  const network = value?.trim().toLowerCase() || 'devnet';
  return network === 'mainnet' ? 'mainnet-beta' : network;
}

export function readBlockchainConfig(
  env: NodeJS.ProcessEnv = process.env,
): BlockchainConfig {
  const provider: BlockchainProviderName =
    env.BLOCKCHAIN_PROVIDER?.trim().toLowerCase() === 'local'
      ? 'local'
      : 'solana';

  return {
    enabled: readBoolean(env.BLOCKCHAIN_ENABLED, false),
    provider,
    network:
      provider === 'local' ? 'local' : normalizeNetwork(env.BLOCKCHAIN_NETWORK),
    maxAttempts: readPositiveInt(env.BLOCKCHAIN_MAX_ATTEMPTS, 3),
    retryDelayMs: readPositiveInt(env.BLOCKCHAIN_RETRY_DELAY_MS, 1_000),
    pendingTimeoutMs: readPositiveInt(
      env.BLOCKCHAIN_PENDING_TIMEOUT_MS,
      5 * 60_000,
    ),
  };
}
