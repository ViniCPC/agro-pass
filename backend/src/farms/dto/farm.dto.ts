import type { Farm } from '../../../generated/prisma/client';
import type { Biome, ValidationStatus } from '../../../generated/prisma/enums';

interface FarmDtoMeta {
  producerName?: string;
  cooperativeName?: string | null;
}

export class FarmDto {
  id!: string;
  name!: string;
  city!: string;
  state!: string;
  latitude!: number;
  longitude!: number;
  carNumber!: string | null;
  polygonGeoJson!: object | null;
  carRawJson!: object | null;
  totalAreaHa!: number | null;
  legalReserveAreaHa!: number | null;
  appAreaHa!: number | null;
  consolidatedAreaHa!: number | null;
  biome!: Biome | null;
  isAmazonLegal!: boolean;
  lastValidationId!: string | null;
  lastValidationStatus!: ValidationStatus | null;
  lastValidationHash!: string | null;
  lastValidatedAt!: Date | null;
  status!: string;
  producerId!: string;
  producerName!: string | null;
  cooperativeName!: string | null;
  createdAt!: Date;

  static fromModel(farm: Farm, meta?: FarmDtoMeta): FarmDto {
    return {
      id: farm.id,
      name: farm.name,
      city: farm.city,
      state: farm.state,
      latitude: farm.latitude,
      longitude: farm.longitude,
      carNumber: farm.carNumber,
      polygonGeoJson: farm.polygonGeoJson as object | null,
      carRawJson: farm.carRawJson as object | null,
      totalAreaHa: farm.totalAreaHa,
      legalReserveAreaHa: farm.legalReserveAreaHa,
      appAreaHa: farm.appAreaHa,
      consolidatedAreaHa: farm.consolidatedAreaHa,
      biome: farm.biome,
      isAmazonLegal: farm.isAmazonLegal,
      lastValidationId: farm.lastValidationId,
      lastValidationStatus: farm.lastValidationStatus,
      lastValidationHash: farm.lastValidationHash,
      lastValidatedAt: farm.lastValidatedAt,
      status: farm.status,
      producerId: farm.producerId,
      producerName: meta?.producerName ?? null,
      cooperativeName: meta?.cooperativeName ?? null,
      createdAt: farm.createdAt,
    };
  }
}
