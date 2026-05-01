import type { Farm } from '../../../generated/prisma/client';
import type { Biome } from '../../../generated/prisma/enums';

export class FarmDto {
  id!: string;
  name!: string;
  city!: string;
  state!: string;
  latitude!: number;
  longitude!: number;
  carNumber!: string | null;
  polygonGeoJson!: object | null;
  totalAreaHa!: number | null;
  legalReserveAreaHa!: number | null;
  appAreaHa!: number | null;
  consolidatedAreaHa!: number | null;
  biome!: Biome | null;
  isAmazonLegal!: boolean;
  lastValidationId!: string | null;
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
      polygonGeoJson: farm.polygonGeoJson as object | null,
      totalAreaHa: farm.totalAreaHa,
      legalReserveAreaHa: farm.legalReserveAreaHa,
      appAreaHa: farm.appAreaHa,
      consolidatedAreaHa: farm.consolidatedAreaHa,
      biome: farm.biome,
      isAmazonLegal: farm.isAmazonLegal,
      lastValidationId: farm.lastValidationId,
      status: farm.status,
      producerId: farm.producerId,
      createdAt: farm.createdAt,
    };
  }
}
