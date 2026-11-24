import type { Farm } from '../../../generated/prisma/client';

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
  totalAreaHa!: number | null;
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
      totalAreaHa: farm.totalAreaHa,
      producerId: farm.producerId,
      producerName: meta?.producerName ?? null,
      cooperativeName: meta?.cooperativeName ?? null,
      createdAt: farm.createdAt,
    };
  }
}
