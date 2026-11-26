import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { FarmDto } from './dto/farm.dto';
import { ListFarmsResponseDto } from './dto/list-farms-response.dto';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFarmDto: CreateFarmDto, user: AuthUser): Promise<FarmDto> {
    if (
      user.role !== UserRole.ADMIN &&
      user.producerId !== createFarmDto.producerId
    ) {
      throw new ForbiddenException(
        'Produtor so pode cadastrar propriedades para a propria conta.',
      );
    }

    const farm = await this.prisma.farm.create({
      data: {
        name: createFarmDto.name.trim(),
        city: createFarmDto.city.trim(),
        state: createFarmDto.state.trim().toUpperCase(),
        latitude: createFarmDto.latitude,
        longitude: createFarmDto.longitude,
        carNumber: createFarmDto.carNumber?.trim() || null,
        polygonGeoJson: this.toNullableJsonInput(createFarmDto.polygonGeoJson),
        totalAreaHa: createFarmDto.totalAreaHa ?? null,
        producerId: createFarmDto.producerId,
      },
    });
    return FarmDto.fromModel(farm);
  }

  async findAll(
    page: number,
    limit: number,
    where: Prisma.FarmWhereInput = {},
  ): Promise<ListFarmsResponseDto> {
    const skip = (page - 1) * limit;

    const [farms, totalItems] = await this.prisma.$transaction([
      this.prisma.farm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.farm.count({ where }),
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

  private toNullableJsonInput(value: object | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
  }
}
