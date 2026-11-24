import { Logger } from '@nestjs/common';
import {
  mintV1,
  mintV2,
  parseLeafFromMintV1Transaction,
  parseLeafFromMintV2Transaction,
  TokenProgramVersion,
  TokenStandard,
} from '@metaplex-foundation/mpl-bubblegum';
import {
  publicKey,
  transactionBuilder,
  type TransactionBuilder,
  type Umi,
} from '@metaplex-foundation/umi';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import {
  NonRetryableProofError,
  type BlockchainProofProvider,
  type ProofReceipt,
  type ProofRequest,
} from '../blockchain/blockchain-proof.provider';
import { isSolanaNetwork } from '../blockchain/blockchain.config';
import { createUmiClient } from './umi.client';

const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const MEMO_PREFIX = 'agropass:v1';
// Recent treasury transactions scanned when looking for an existing proof.
const SIGNATURE_SCAN_LIMIT = 1_000;

export interface SolanaProofProviderOptions {
  network: string;
  rpcUrl?: string;
  keypairPath?: string;
  merkleTree?: string;
}

// The memo makes the anchored hash readable on the explorer page of the
// transaction: anyone can compare it with the hash shown on the passport.
export function buildProofMemo(publicCode: string, chainHash: string) {
  return `${MEMO_PREFIX}:${publicCode}:${chainHash}`;
}

// The RPC returns memos as "[<length>] <text>", several joined by "; ".
export function parseProofMemos(raw: string | null | undefined) {
  if (!raw) return [];
  return raw
    .split('; ')
    .map((part) => part.replace(/^\[\d+\]\s*/, '').trim())
    .map((memo) => {
      const match = /^agropass:v1:(.+):([a-f0-9]{64})$/.exec(memo);
      return match ? { publicCode: match[1], chainHash: match[2] } : null;
    })
    .filter(
      (memo): memo is { publicCode: string; chainHash: string } =>
        memo !== null,
    );
}

function memoInstruction(text: string): TransactionBuilder {
  return transactionBuilder().add({
    instruction: {
      programId: publicKey(MEMO_PROGRAM_ID),
      keys: [],
      data: new TextEncoder().encode(text),
    },
    signers: [],
    bytesCreatedOnChain: 0,
  });
}

function isUnsupportedSchemaVersionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('unsupported schema version') ||
    message.includes('unsupportedschemaversion')
  );
}

export class SolanaProofProvider implements BlockchainProofProvider {
  private readonly logger = new Logger(SolanaProofProvider.name);
  private clients: { umi: Umi; connection: Connection } | null = null;

  constructor(private readonly options: SolanaProofProviderOptions) {}

  get network() {
    return this.options.network;
  }

  findExisting(request: ProofRequest): Promise<ProofReceipt | null> {
    return this.describeFailures(() => this.lookup(request));
  }

  register(request: ProofRequest): Promise<ProofReceipt> {
    return this.describeFailures(() => this.mint(request));
  }

  // Raw RPC errors ("fetch failed") say nothing to whoever reads them on the
  // batch; configuration errors already carry their own message.
  private async describeFailures<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof NonRetryableProofError) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Falha na comunicacao com a Solana (${this.network}): ${reason}`,
      );
    }
  }

  private async lookup(request: ProofRequest): Promise<ProofReceipt | null> {
    const { umi, connection } = this.getClients();
    const treasury = new PublicKey(umi.identity.publicKey.toString());
    const signatures = await connection.getSignaturesForAddress(
      treasury,
      { limit: SIGNATURE_SCAN_LIMIT },
      'confirmed',
    );

    for (const info of signatures) {
      if (info.err) continue;
      const proof = parseProofMemos(info.memo).find(
        (memo) => memo.publicCode === request.publicCode,
      );
      if (!proof) continue;

      return {
        network: this.network,
        txHash: info.signature,
        tokenAddress: await this.readTokenAddress(umi, info.signature),
        anchoredHash: proof.chainHash,
        anchoredAt: info.blockTime
          ? new Date(info.blockTime * 1000)
          : new Date(),
      };
    }

    return null;
  }

  private async mint(request: ProofRequest): Promise<ProofReceipt> {
    const { umi } = this.getClients();
    const merkleTree = publicKey(
      this.requireOption('merkleTree', 'SOLANA_MERKLE_TREE'),
    );
    const memo = memoInstruction(
      buildProofMemo(request.publicCode, request.chainHash),
    );
    const metadata = {
      name: `AgroPass ${request.batchCode}`,
      symbol: '',
      uri: request.metadataUri,
      sellerFeeBasisPoints: 0,
      primarySaleHappened: false,
      isMutable: false,
      creators: [
        { address: umi.identity.publicKey, verified: false, share: 100 },
      ],
      collection: null,
    };

    let signature: Uint8Array;
    try {
      ({ signature } = await mintV2(umi, {
        leafOwner: umi.identity.publicKey,
        merkleTree,
        metadata: { ...metadata, tokenStandard: TokenStandard.NonFungible },
      })
        .add(memo)
        .sendAndConfirm(umi));
    } catch (error) {
      if (!isUnsupportedSchemaVersionError(error)) throw error;
      // Trees created for Bubblegum v1 only accept mintV1.
      ({ signature } = await mintV1(umi, {
        leafOwner: umi.identity.publicKey,
        merkleTree,
        metadata: {
          ...metadata,
          editionNonce: null,
          uses: null,
          tokenStandard: TokenStandard.NonFungible,
          tokenProgramVersion: TokenProgramVersion.Original,
        },
      })
        .add(memo)
        .sendAndConfirm(umi));
    }

    const txHash = bs58.encode(signature);
    return {
      network: this.network,
      txHash,
      tokenAddress: await this.readTokenAddress(umi, txHash),
      anchoredHash: request.chainHash,
      anchoredAt: new Date(),
    };
  }

  // The asset id is a convenience: the transaction and its memo are the
  // proof, so a parsing failure does not fail the registration.
  private async readTokenAddress(umi: Umi, txHash: string) {
    const signature = bs58.decode(txHash);
    for (const parse of [
      parseLeafFromMintV2Transaction,
      parseLeafFromMintV1Transaction,
    ]) {
      try {
        return (await parse(umi, signature)).id.toString();
      } catch {
        // Try the other mint version.
      }
    }
    this.logger.warn(`Could not read the cNFT asset id of ${txHash}`);
    return null;
  }

  private getClients() {
    if (this.clients) return this.clients;

    if (!isSolanaNetwork(this.network)) {
      throw new NonRetryableProofError(
        `BLOCKCHAIN_NETWORK invalida: "${this.network}". Use devnet, testnet ou mainnet-beta.`,
      );
    }

    const rpcUrl = this.options.rpcUrl?.trim() || clusterApiUrl(this.network);
    const keypairPath = this.requireOption(
      'keypairPath',
      'SOLANA_TREASURY_KEYPAIR_PATH',
    );

    let umi: Umi;
    try {
      umi = createUmiClient({ rpcUrl, keypairPath });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new NonRetryableProofError(`Keypair Solana ilegivel: ${reason}`);
    }

    this.clients = { umi, connection: new Connection(rpcUrl, 'confirmed') };
    return this.clients;
  }

  private requireOption(
    key: 'keypairPath' | 'merkleTree',
    envName: string,
  ): string {
    const value = this.options[key]?.trim();
    if (!value || value === 'ENDERECO_DA_TREE_AQUI') {
      throw new NonRetryableProofError(`${envName} nao foi configurado.`);
    }
    return value;
  }
}
