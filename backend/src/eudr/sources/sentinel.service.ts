import { Injectable } from '@nestjs/common';
import { EudrValidationMode } from '../dto/validate-farm.dto';
import { EUDR_CUTOFF_DATE } from '../eudr.constants';
import { AnalyzeFarmInput, MockConfidence } from './source-input.types';

export type SentinelMockResult = {
  source: 'SENTINEL2_MOCK';
  futureSource: 'COPERNICUS_SENTINEL2';
  apiPlanned: string;
  mode: EudrValidationMode;
  cutoffDate: string;
  satelliteImageBeforeUrl: string;
  satelliteImageAfterUrl: string;
  ndviBefore: number;
  ndviAfter: number;
  ndviDelta: number;
  confidence: MockConfidence;
  message: string;
};

const BEFORE_DATE = '2020-12-31';
const AFTER_DATE = new Date().toISOString().slice(0, 10);
const MOCK_BASE_URL = 'https://mock-eo.agropass.dev/sentinel2';

@Injectable()
export class SentinelService {
  private readonly plannedApi =
    'https://services.sentinel-hub.com/api/v1/process (Sentinel Hub Processing API)';

  async analyzeFarm(input: AnalyzeFarmInput): Promise<SentinelMockResult> {
    const mode = input.mode ?? EudrValidationMode.SEMI_AUTOMATIC;

    const { ndviBefore, ndviAfter } =
      mode === EudrValidationMode.MOCK
        ? this.getMockNdvi()
        : this.calculateSemiAutomaticNdvi(input);

    const satelliteImageBeforeUrl = `${MOCK_BASE_URL}/${input.farmId}/before_${BEFORE_DATE}.png`;
    const satelliteImageAfterUrl = `${MOCK_BASE_URL}/${input.farmId}/after_${AFTER_DATE}.png`;

    return {
      source: 'SENTINEL2_MOCK',
      futureSource: 'COPERNICUS_SENTINEL2',
      apiPlanned: this.plannedApi,
      mode,
      cutoffDate: EUDR_CUTOFF_DATE,
      satelliteImageBeforeUrl,
      satelliteImageAfterUrl,
      ndviBefore,
      ndviAfter,
      ndviDelta: Number((ndviAfter - ndviBefore).toFixed(3)),
      confidence: this.getConfidence(input, mode),
      message:
        'Mock semiautomatico para demo. Sera substituido por consulta real ao Sentinel Hub / Copernicus.',
    };
  }

  private getMockNdvi(): { ndviBefore: number; ndviAfter: number } {
    return { ndviBefore: 0.65, ndviAfter: 0.62 };
  }

  private calculateSemiAutomaticNdvi(input: AnalyzeFarmInput): { ndviBefore: number; ndviAfter: number } {
    const seed = Math.abs(Math.sin(input.latitude * 300 + input.longitude * 500));

    // ndviBefore: healthy baseline between 0.45 and 0.75
    const ndviBefore = Number((0.45 + seed * 0.3).toFixed(3));

    // ndviAfter: drops proportionally to deforestation seed
    const dropFactor = seed < 0.5 ? 0.02 : seed < 0.8 ? 0.08 : 0.22;
    const ndviAfter = Number(Math.max(0.1, ndviBefore - dropFactor).toFixed(3));

    return { ndviBefore, ndviAfter };
  }

  private getConfidence(input: AnalyzeFarmInput, mode: EudrValidationMode): MockConfidence {
    if (mode === EudrValidationMode.MOCK) {
      return 'MEDIUM';
    }

    if (!input.polygonGeoJson) {
      return 'LOW';
    }

    return 'HIGH';
  }
}
