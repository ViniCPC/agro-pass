import type { Batch, Farm } from '../../../generated/prisma/client';

class FarmSummaryDto {
  name!: string;
  latitude!: number;
  longitude!: number;
}

export class BatchDto {
  id!: string;
  code!: string;
  productType!: string;
  quantity!: number;
  unit!: string;
  harvestDate!: Date | null;
  status!: string;
  farm!: FarmSummaryDto;
  createdAt!: Date;

  static fromModel(batch: Batch & { farm: Farm }): BatchDto {
    return {
      id: batch.id,
      code: batch.code,
      productType: batch.productType,
      quantity: batch.quantity,
      unit: batch.unit,
      harvestDate: batch.harvestDate,
      status: batch.status,
      farm: {
        name: batch.farm.name,
        latitude: batch.farm.latitude,
        longitude: batch.farm.longitude,
      },
      createdAt: batch.createdAt,
    };
  }
}
