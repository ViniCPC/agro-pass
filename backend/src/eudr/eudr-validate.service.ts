import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EUDR_CUTOFF_DATE, EUDR_VALIDITY_MONTHS } from './eudr.constants';
import { EudrValidationMode, ValidateFarmDto } from './dto/validate-farm.dto';
import { HansenService } from './sources/hansen.service';
import { MapBiomasService } from './sources/mapbiomas.service';
import { ProdesService } from './sources/prodes.service';
import { SentinelService } from './sources/sentinel.service';
import { AnalyzeFarmInput } from './sources/source-input.types';
import { createSha256Hash } from './utils/hash.util';
import {
  calculateHectaresDeforested,
  classifyValidationStatus,
  toApiStatus,
  toCutoffDate,
  toFarmStatus,
} from './utils/eudr-status.util';

@Injectable()
export class EudrValidateService {
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

    const [mapBiomasResult, prodesResult, hansenResult, sentinelResult] =
      await Promise.all([
        this.mapBiomasService.analyzeFarm(sourceInput),
        this.prodesService.analyzeFarm(sourceInput),
        this.hansenService.analyzeFarm(sourceInput),
        this.sentinelService.analyzeFarm(sourceInput),
      ]);

    const hectaresDeforested = calculateHectaresDeforested([
      mapBiomasResult.hectaresDeforested,
      prodesResult.hectaresDeforested,
      hansenResult.hectaresDeforested,
    ]);

    const validationStatus = classifyValidationStatus(hectaresDeforested);
    const farmStatus = toFarmStatus(validationStatus);

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
          cutoffDate: toCutoffDate(),
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
          lastValidationStatus: createdValidation.status,
          lastValidationHash: createdValidation.evidenceHash,
          lastValidatedAt: createdValidation.validatedAt,
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
      status: toApiStatus(validation.status),
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
      ndviDelta: sentinelResult.ndviDelta,
    };
  }
}
