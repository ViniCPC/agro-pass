export const BLOCKCHAIN_PROOF_PROVIDER = Symbol('BLOCKCHAIN_PROOF_PROVIDER');

export interface ProofRequest {
  batchId: string;
  batchCode: string;
  publicCode: string;
  // Final hash of the batch event chain: the value anchored on-chain.
  chainHash: string;
  metadataUri: string;
}

export interface ProofReceipt {
  network: string;
  txHash: string;
  tokenAddress: string | null;
  // The hash actually carried by the on-chain record.
  anchoredHash: string;
  anchoredAt: Date;
}

// Registers one proof (a cNFT) per batch. Events stay in PostgreSQL; only the
// final chain hash goes on-chain.
export interface BlockchainProofProvider {
  readonly network: string;

  // Proof already registered for this batch, if any. Checked before every
  // attempt, so a retry after a lost response never mints a second token.
  findExisting(request: ProofRequest): Promise<ProofReceipt | null>;

  register(request: ProofRequest): Promise<ProofReceipt>;
}

// Configuration problems (missing keypair, tree, unknown network): retrying
// cannot fix them.
export class NonRetryableProofError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableProofError';
  }
}
