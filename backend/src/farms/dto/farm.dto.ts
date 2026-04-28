import { Farm } from '../../../generated/prisma/client';

export class FarmDto {
  id!: string;
  name!: string;
  city!: string;
  state!: string;
  latitude!: number;
  longitude!: number;
  carNumber!: string | null;
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
      status: farm.status,
      producerId: farm.producerId,
      createdAt: farm.createdAt,
    };
  }
}
