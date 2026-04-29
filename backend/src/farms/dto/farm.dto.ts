import { Biome, Farm } from '../../../generated/prisma/client';

export class FarmDto {
  id!: string;
  name!: string;
  city!: string;
  state!: string;
  latitude!: number;
  longitude!: number;
  carNumber!: string | null;
  totalAreaHa!: number | null;
  legalReserveAreaHa!: number | null;
  appAreaHa!: number | null;
  consolidatedAreaHa!: number | null;
  biome!: Biome | null;
  isAmazonLegal!: boolean;
  isEudrCompliant!: boolean;
  eudrEvidenceUrl!: string | null;
  validatedAt!: Date | null;
  preservedSurplusHa!: number | null;
  status!: string;
  producerId!: string;
  createdAt!: Date;

  static fromModel(farm: Farm): FarmDto {
    return {
      id: farm.id,
      name: farm.name,
      city: farm.city,
      state: farm.state,
      latitude: farm.latitude,
      longitude: farm.longitude,
      carNumber: farm.carNumber,
      totalAreaHa: farm.totalAreaHa,
      legalReserveAreaHa: farm.legalReserveAreaHa,
      appAreaHa: farm.appAreaHa,
      consolidatedAreaHa: farm.consolidatedAreaHa,
      biome: farm.biome,
      isAmazonLegal: farm.isAmazonLegal,
      isEudrCompliant: farm.isEudrCompliant,
      eudrEvidenceUrl: farm.eudrEvidenceUrl,
      validatedAt: farm.validatedAt,
      preservedSurplusHa: farm.preservedSurplusHa,
      status: farm.status,
      producerId: farm.producerId,
      createdAt: farm.createdAt,
    };
  }
}
