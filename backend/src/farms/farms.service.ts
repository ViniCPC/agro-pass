import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { FarmDto } from './dto/farm.dto';
import { ListFarmsResponseDto } from './dto/list-farms-response.dto';
import { UpdateFarmStatusDto } from './dto/update-farm-status.dto';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFarmDto: CreateFarmDto): Promise<FarmDto> {
    const farm = await this.prisma.farm.create({
      data: {
        name: createFarmDto.name.trim(),
        city: createFarmDto.city.trim(),
        state: createFarmDto.state.trim().toUpperCase(),
        latitude: createFarmDto.latitude,
        longitude: createFarmDto.longitude,
        carNumber: createFarmDto.carNumber?.trim() || null,
        polygonGeoJson: this.toNullableJsonInput(createFarmDto.polygonGeoJson),
        carRawJson: this.toNullableJsonInput(createFarmDto.carRawJson),
        totalAreaHa: createFarmDto.totalAreaHa ?? null,
        legalReserveAreaHa: createFarmDto.legalReserveAreaHa ?? null,
        appAreaHa: createFarmDto.appAreaHa ?? null,
        consolidatedAreaHa: createFarmDto.consolidatedAreaHa ?? null,
        biome: createFarmDto.biome ?? null,
        isAmazonLegal: createFarmDto.isAmazonLegal ?? false,
        producerId: createFarmDto.producerId,
      },
    });
    return FarmDto.fromModel(farm);
  }

  async findAll(page: number, limit: number): Promise<ListFarmsResponseDto> {
    const skip = (page - 1) * limit;

    const [farms, totalItems] = await this.prisma.$transaction([
      this.prisma.farm.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.farm.count(),
    ]);

    return {
      data: farms.map((farm) => FarmDto.fromModel(farm)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async findOne(id: string): Promise<FarmDto> {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: { producer: { include: { cooperative: true } } },
    });

    if (!farm) {
      throw new NotFoundException('Fazenda não encontrada.');
    }

    return FarmDto.fromModel(farm, {
      producerName: farm.producer.name,
      cooperativeName: farm.producer.cooperative?.name ?? null,
    });
  }

  async updateStatus(id: string, dto: UpdateFarmStatusDto): Promise<FarmDto> {
    const farm = await this.prisma.farm.findUnique({ where: { id } });

    if (!farm) {
      throw new NotFoundException('Fazenda não encontrada.');
    }

    const updated = await this.prisma.farm.update({
      where: { id: farm.id },
      data: { status: dto.status },
    });

    return FarmDto.fromModel(updated);
  }

  private toNullableJsonInput(value: object | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
  }
}
