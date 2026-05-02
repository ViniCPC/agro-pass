import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FarmStatus, ValidationStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { EUDR_CUTOFF_DATE, EUDR_VALIDITY_MONTHS } from './eudr.constants';
import { EudrValidationDto } from './dto/eudr-validation.dto';
import { ListValidationsResponseDto } from './dto/list-validations-response.dto';
import { EudrValidationMode, ValidateFarmDto } from './dto/validate-farm.dto';
import { HansenService } from './sources/hansen.service';
import { MapBiomasService } from './sources/mapbiomas.service';
import { ProdesService } from './sources/prodes.service';
import { SentinelService } from './sources/sentinel.service';
import { AnalyzeFarmInput } from './sources/source-input.types';
import { createSha256Hash } from './utils/hash.util';

@Injectable()
export class EudrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapBiomasService: MapBiomasService,
    private readonly prodesService: ProdesService,
    private readonly hansenService: HansenService,
    private readonly sentinelService: SentinelService,
  ) {}

  async validateFarm(farmId: string, dto: ValidateFarmDto) {
    const farm = await this.prisma.farm.findUnique({
      where: {
        id: farmId,
      },
      include: {
        producer: true,
      },
    });

    if (!farm) {
      throw new NotFoundException('Fazenda nao encontrada.');
    }

    const mode = dto.mode ?? EudrValidationMode.SEMI_AUTOMATIC;

    if (
      mode === EudrValidationMode.SEMI_AUTOMATIC &&
      dto.mockHectaresDeforested !== undefined
    ) {
      throw new BadRequestException(
        'mockHectaresDeforested so pode ser informado quando mode for MOCK.',
      );
    }

    if (!farm.latitude || !farm.longitude) {
      throw new BadRequestException(
        'A fazenda precisa ter latitude e longitude.',
      );
    }

    const sourceInput: AnalyzeFarmInput = {
      farmId: farm.id,
      farmName: farm.name,
      latitude: farm.latitude,
      longitude: farm.longitude,
      polygonGeoJson: farm.polygonGeoJson,
      mode,
      mockHectaresDeforested: dto.mockHectaresDeforested,
    };

    const [mapBiomasResult, prodesResult, hansenResult, sentinelResult] = await Promise.all([
      this.mapBiomasService.analyzeFarm(sourceInput),
      this.prodesService.analyzeFarm(sourceInput),
      this.hansenService.analyzeFarm(sourceInput),
      this.sentinelService.analyzeFarm(sourceInput),
    ]);

    const hectaresDeforested = this.calculateHectaresDeforested([
      mapBiomasResult.hectaresDeforested,
      prodesResult.hectaresDeforested,
      hansenResult.hectaresDeforested,
    ]);

    const validationStatus = this.classifyValidationStatus(hectaresDeforested);
    const farmStatus = this.toFarmStatus(validationStatus);

    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + EUDR_VALIDITY_MONTHS);

    const evidencePayload = {
      farm: {
        id: farm.id,
        name: farm.name,
        city: farm.city,
        state: farm.state,
        latitude: farm.latitude,
        longitude: farm.longitude,
        carNumber: farm.carNumber,
        polygonGeoJson: farm.polygonGeoJson,
      },
      producer: {
        id: farm.producer.id,
        name: farm.producer.name,
        document: farm.producer.document,
      },
      validation: {
        status: validationStatus,
        mode,
        cutoffDate: EUDR_CUTOFF_DATE,
        hectaresDeforested,
        mapBiomasResult,
        prodesResult,
        hansenResult,
        sentinelResult,
        notes: dto.notes,
      },
      generatedAt: new Date().toISOString(),
    };

    const evidenceHash = createSha256Hash(evidencePayload);

    const validation = await this.prisma.$transaction(async (tx) => {
      const createdValidation = await tx.eudrValidation.create({
        data: {
          farmId: farm.id,
          status: validationStatus,
          cutoffDate: this.toCutoffDate(),
          hectaresDeforested,
          mapBiomasResult,
          prodesResult,
          hansenResult,
          satelliteImageBeforeUrl: sentinelResult.satelliteImageBeforeUrl,
          satelliteImageAfterUrl: sentinelResult.satelliteImageAfterUrl,
          ndviBefore: sentinelResult.ndviBefore,
          ndviAfter: sentinelResult.ndviAfter,
          evidenceHash,
          validUntil,
        },
      });

      await tx.farm.update({
        where: {
          id: farm.id,
        },
        data: {
          lastValidationId: createdValidation.id,
          status: farmStatus,
        },
      });

      return createdValidation;
    });

    return {
      message: 'Validacao EUDR concluida.',
      validationId: validation.id,
      farmId: farm.id,
      farmName: farm.name,
      status: validation.status,
      farmStatus,
      hectaresDeforested,
      cutoffDate: validation.cutoffDate,
      validUntil: validation.validUntil,
      evidenceHash,
      mapBiomasResult,
      prodesResult,
      hansenResult,
      satelliteImageBeforeUrl: sentinelResult.satelliteImageBeforeUrl,
      satelliteImageAfterUrl: sentinelResult.satelliteImageAfterUrl,
      ndviBefore: sentinelResult.ndviBefore,
      ndviAfter: sentinelResult.ndviAfter,
    };
  }

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

  private classifyValidationStatus(
    hectaresDeforested: number,
  ): ValidationStatus {
    if (hectaresDeforested === 0) {
      return ValidationStatus.COMPLIANT;
    }

    if (hectaresDeforested > 0 && hectaresDeforested < 1) {
      return ValidationStatus.NEEDS_REVIEW;
    }

    return ValidationStatus.NON_COMPLIANT;
  }

  private calculateHectaresDeforested(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const average =
      values.reduce((total, current) => total + current, 0) / values.length;

    return Number(average.toFixed(2));
  }

  private toCutoffDate(): Date {
    return new Date(`${EUDR_CUTOFF_DATE}T00:00:00.000Z`);
  }

  private toFarmStatus(status: ValidationStatus): FarmStatus {
    if (status === ValidationStatus.COMPLIANT) {
      return FarmStatus.APPROVED;
    }

    if (status === ValidationStatus.NON_COMPLIANT) {
      return FarmStatus.REJECTED;
    }

    return FarmStatus.PENDING;
  }
}
