import { createHash } from 'crypto';
import type {
  BlockchainProofProvider,
  ProofReceipt,
  ProofRequest,
} from './blockchain-proof.provider';

// In-memory stand-in for the chain, for tests and offline development.
// Deterministic, never touches the network, and keeps one proof per batch
// like the real registry.
export class LocalProofProvider implements BlockchainProofProvider {
  readonly network = 'local';
  private readonly receipts = new Map<string, ProofReceipt>();

  findExisting(request: ProofRequest): Promise<ProofReceipt | null> {
    return Promise.resolve(this.receipts.get(request.batchId) ?? null);
  }

  register(request: ProofRequest): Promise<ProofReceipt> {
    const existing = this.receipts.get(request.batchId);
    if (existing) return Promise.resolve(existing);

    const digest = createHash('sha256')
      .update(`${request.batchId}:${request.chainHash}`)
      .digest('hex');
    const receipt: ProofReceipt = {
      network: this.network,
      txHash: `local-tx-${digest}`,
      tokenAddress: `local-token-${digest.slice(0, 32)}`,
      anchoredHash: request.chainHash,
      anchoredAt: new Date(),
    };
    this.receipts.set(request.batchId, receipt);
    return Promise.resolve(receipt);
  }

  // Every proof registered so far, for assertions in tests.
  registered(): ProofReceipt[] {
    return [...this.receipts.values()];
  }
}
