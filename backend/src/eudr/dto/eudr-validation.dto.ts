import type { EudrValidation } from '../../../generated/prisma/client';
import type { ValidationStatus } from '../../../generated/prisma/enums';

export class EudrValidationDto {
  id!: string;
  status!: ValidationStatus;
  cutoffDate!: Date;
  hectaresDeforested!: number;
  mapBiomasResult!: object | null;
  prodesResult!: object | null;
  hansenResult!: object | null;
  satelliteImageBeforeUrl!: string | null;
  satelliteImageAfterUrl!: string | null;
  ndviBefore!: number | null;
  ndviAfter!: number | null;
  evidenceHash!: string;
  validatedAt!: Date;
  validUntil!: Date;
  farmId!: string;

  static fromModel(validation: EudrValidation): EudrValidationDto {
    return {
      id: validation.id,
      status: validation.status,
      cutoffDate: validation.cutoffDate,
      hectaresDeforested: validation.hectaresDeforested,
      mapBiomasResult: validation.mapBiomasResult as object | null,
      prodesResult: validation.prodesResult as object | null,
      hansenResult: validation.hansenResult as object | null,
      satelliteImageBeforeUrl: validation.satelliteImageBeforeUrl,
      satelliteImageAfterUrl: validation.satelliteImageAfterUrl,
      ndviBefore: validation.ndviBefore,
      ndviAfter: validation.ndviAfter,
      evidenceHash: validation.evidenceHash,
      validatedAt: validation.validatedAt,
      validUntil: validation.validUntil,
      farmId: validation.farmId,
    };
  }
}
