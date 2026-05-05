import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EudrValidationDto } from './dto/eudr-validation.dto';
import { ListValidationsResponseDto } from './dto/list-validations-response.dto';

@Injectable()
export class EudrQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getLastValidation(farmId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: {
        id: farmId,
      },
      include: {
        lastValidation: true,
      },
    });

    if (!farm) {
      throw new NotFoundException('Fazenda nao encontrada.');
    }

    if (!farm.lastValidation) {
      return {
        message: 'Esta fazenda ainda nao possui validacao EUDR.',
        farmId: farm.id,
        farmName: farm.name,
        farmStatus: farm.status,
        lastValidation: null,
      };
    }

    return {
      farmId: farm.id,
      farmName: farm.name,
      farmStatus: farm.status,
      lastValidation: EudrValidationDto.fromModel(farm.lastValidation),
    };
  }

  async getValidationHistory(
    farmId: string,
    page: number,
    limit: number,
  ): Promise<ListValidationsResponseDto> {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!farm) {
      throw new NotFoundException('Fazenda nao encontrada.');
    }

    const skip = (page - 1) * limit;

    const [validations, totalItems] = await this.prisma.$transaction([
      this.prisma.eudrValidation.findMany({
        where: { farmId: farm.id },
        orderBy: { validatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.eudrValidation.count({
        where: { farmId: farm.id },
      }),
    ]);

    return {
      farmId: farm.id,
      farmName: farm.name,
      farmStatus: farm.status,
      data: validations.map((validation) =>
        EudrValidationDto.fromModel(validation),
      ),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }
}
