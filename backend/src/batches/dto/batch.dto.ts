import type { Batch, Farm } from '../../../generated/prisma/client';
import { explorerAddressUrl, explorerTxUrl } from '../../blockchain/explorer';

class FarmSummaryDto {
  name!: string;
  latitude!: number;
  longitude!: number;
}

class BlockchainProofDto {
  status!: string;
  network!: string | null;
  proofHash!: string | null;
  txHash!: string | null;
  attempts!: number;
  error!: string | null;
  explorerTxUrl!: string | null;
  explorerTokenUrl!: string | null;
}

export class BatchDto {
  id!: string;
  code!: string;
  productType!: string;
  quantity!: number;
  unit!: string;
  harvestDate!: Date | null;
  status!: string;
  publicCode!: string;
  isPublic!: boolean;
  integrityHash!: string | null;
  tokenAddress!: string | null;
  tokenizedAt!: Date | null;
  closedAt!: Date | null;
  blockchain!: BlockchainProofDto;
  farm!: FarmSummaryDto;
  createdAt!: Date;
  updatedAt!: Date;

  static fromModel(batch: Batch & { farm: Farm }): BatchDto {
    return {
      id: batch.id,
      code: batch.code,
      productType: batch.productType,
      quantity: batch.quantity,
      unit: batch.unit,
      harvestDate: batch.harvestDate,
      status: batch.status,
      publicCode: batch.publicCode,
      isPublic: batch.isPublic,
      integrityHash: batch.integrityHash,
      tokenAddress: batch.tokenAddress,
      tokenizedAt: batch.tokenizedAt,
      closedAt: batch.closedAt,
      blockchain: {
        status: batch.tokenizationStatus,
        network: batch.blockchainNetwork,
        proofHash: batch.proofHash,
        txHash: batch.tokenTxHash,
        attempts: batch.tokenizationAttempts,
        error: batch.tokenizationError,
        explorerTxUrl: explorerTxUrl(
          batch.blockchainNetwork,
          batch.tokenTxHash,
        ),
        explorerTokenUrl: explorerAddressUrl(
          batch.blockchainNetwork,
          batch.tokenAddress,
        ),
      },
      farm: {
        name: batch.farm.name,
        latitude: batch.farm.latitude,
        longitude: batch.farm.longitude,
      },
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }
}
