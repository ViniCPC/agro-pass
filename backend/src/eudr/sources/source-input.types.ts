import { EudrValidationMode } from '../dto/validate-farm.dto';

export type AnalyzeFarmInput = {
  farmId: string;
  farmName: string;
  latitude: number;
  longitude: number;
  polygonGeoJson?: unknown;
  mode?: EudrValidationMode;
  mockHectaresDeforested?: number;
};

export type MockConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
