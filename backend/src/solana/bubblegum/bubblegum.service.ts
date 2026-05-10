import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  mintV1,
  mintV2,
  parseLeafFromMintV2Transaction,
  TokenProgramVersion,
  TokenStandard,
} from '@metaplex-foundation/mpl-bubblegum';
import { publicKey } from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import { PrismaService } from '../../prisma/prisma.service';
import { createUmiClient } from '../umi.client';

@Injectable()
export class BubblegumService {
  constructor(private readonly prisma: PrismaService) {}

  async mintBatchCnft(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        farm: {
          include: {
            producer: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.cnftAddress || batch.mintTxHash) {
      throw new BadRequestException('Batch already has a minted cNFT');
    }

    const rpcUrl = this.getEnvOrThrow('SOLANA_RPC_URL');
    const keypairPath = this.getEnvOrThrow('SOLANA_TREASURY_KEYPAIR_PATH');
    const merkleTreeAddress = this.getEnvOrThrow('SOLANA_MERKLE_TREE');
    const publicBackendUrl =
      process.env.PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

    const umi = createUmiClient({
      rpcUrl,
      keypairPath,
    });

    const metadataUri = `${publicBackendUrl}/public/batches/${batch.code}/metadata.json`;

    const baseMetadata = {
      name: `AgroPass Batch ${batch.code}`,
      symbol: '',
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      primarySaleHappened: false,
      isMutable: true,
      creators: [
        {
          address: umi.identity.publicKey,
          verified: false,
          share: 100,
        },
      ],
      collection: null,
    };

    let signature: Uint8Array;

    try {
      ({ signature } = await mintV2(umi, {
        leafOwner: umi.identity.publicKey,
        merkleTree: publicKey(merkleTreeAddress),
        metadata: {
          ...baseMetadata,
          tokenStandard: TokenStandard.NonFungible,
        },
      }).sendAndConfirm(umi));
    } catch (error) {
      if (!this.isUnsupportedSchemaVersionError(error)) {
        throw error;
      }

      ({ signature } = await mintV1(umi, {
        leafOwner: umi.identity.publicKey,
        merkleTree: publicKey(merkleTreeAddress),
        metadata: {
          ...baseMetadata,
          editionNonce: null,
          uses: null,
          tokenStandard: TokenStandard.NonFungible,
          tokenProgramVersion: TokenProgramVersion.Original,
        },
      }).sendAndConfirm(umi));
    }

    const txHash = bs58.encode(signature);

    let cnftAddress: string | null = null;

    try {
      const leaf = await parseLeafFromMintV2Transaction(umi, signature);
      cnftAddress = leaf.id.toString();
    } catch {
      cnftAddress = null;
    }

    const updatedBatch = await this.prisma.batch.update({
      where: { id: batch.id },
      data: {
        cnftAddress,
        metadataUri,
        mintTxHash: txHash,
        merkleTree: merkleTreeAddress,
      },
    });

    return {
      message: 'cNFT minted successfully',
      batchId: updatedBatch.id,
      batchCode: updatedBatch.code,
      cnftAddress,
      metadataUri,
      mintTxHash: txHash,
      merkleTree: merkleTreeAddress,
    };
  }

  private getEnvOrThrow(key: string): string {
    const value = process.env[key]?.trim();

    if (!value || value === 'ENDERECO_DA_TREE_AQUI') {
      throw new BadRequestException(`${key} nao foi configurado no .env`);
    }

    return value;
  }

  private isUnsupportedSchemaVersionError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const msg = error.message.toLowerCase();
    return (
      msg.includes('unsupported schema version') ||
      msg.includes('unsupportedschemaversion')
    );
  }
}
