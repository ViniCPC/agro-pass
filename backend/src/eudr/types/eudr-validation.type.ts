import { MapBiomasResult } from './mapbiomas-result.type';

export type EudrValidationStatus = 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';

export type EudrValidation = {
  farmId: string;
  batchId?: string;

  status: EudrValidationStatus;

  checkedAt: Date;

  sources: {
    mapbiomas: MapBiomasResult;
  };

  summary: {
    deforestationDetected: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
    message: string;
  };

  evidenceHash: string;
};
