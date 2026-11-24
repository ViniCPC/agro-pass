import { Logger, Module } from '@nestjs/common';
import { EventChainModule } from '../event-chain/event-chain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SolanaProofProvider } from '../solana/solana-proof.provider';
import { BatchTokenizationService } from './batch-tokenization.service';
import {
  BLOCKCHAIN_PROOF_PROVIDER,
  type BlockchainProofProvider,
} from './blockchain-proof.provider';
import {
  BLOCKCHAIN_CONFIG,
  readBlockchainConfig,
  type BlockchainConfig,
} from './blockchain.config';
import { LocalProofProvider } from './local-proof.provider';

function createProofProvider(
  config: BlockchainConfig,
): BlockchainProofProvider {
  const logger = new Logger('BlockchainModule');
  logger.log(
    config.enabled
      ? `Prova em blockchain ativa: ${config.provider} (${config.network})`
      : 'Prova em blockchain desabilitada (BLOCKCHAIN_ENABLED=false)',
  );

  if (config.provider === 'local') return new LocalProofProvider();

  // Built lazily: the keypair is only read on the first registration, so a
  // missing Solana setup never prevents the API from starting.
  return new SolanaProofProvider({
    network: config.network,
    rpcUrl: process.env.SOLANA_RPC_URL,
    keypairPath: process.env.SOLANA_TREASURY_KEYPAIR_PATH,
    merkleTree: process.env.SOLANA_MERKLE_TREE,
  });
}

@Module({
  imports: [PrismaModule, EventChainModule],
  providers: [
    { provide: BLOCKCHAIN_CONFIG, useFactory: () => readBlockchainConfig() },
    {
      provide: BLOCKCHAIN_PROOF_PROVIDER,
      inject: [BLOCKCHAIN_CONFIG],
      useFactory: createProofProvider,
    },
    BatchTokenizationService,
  ],
  exports: [
    BatchTokenizationService,
    BLOCKCHAIN_CONFIG,
    BLOCKCHAIN_PROOF_PROVIDER,
  ],
})
export class BlockchainModule {}
