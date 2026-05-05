import { MapBiomasResult } from './mapbiomas-result.type';
import { SentinelResult } from './sentinel-result.type';

export type EudrValidationResult = {
  farmId: string;
  batchId?: string;

  status: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT';

  summary: {
    deforestationDetected: boolean;
    vegetationLossDetected: boolean;
    totalAreaHa: number;
    deforestedAreaHa: number;
    alertCount: number;
    ndviBefore: number;
    ndviAfter: number;
    ndviDelta: number;
    message: string;
  };

  sources: {
    mapbiomas: MapBiomasResult;
    sentinel: SentinelResult;
  };

  evidenceHash: string;
  checkedAt: string;
};
