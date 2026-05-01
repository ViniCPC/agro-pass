import { Injectable } from '@nestjs/common';
import { EudrValidationMode } from '../dto/validate-farm.dto';
import { EUDR_CUTOFF_DATE } from '../eudr.constants';
import { AnalyzeFarmInput, MockConfidence } from './source-input.types';

export type HansenMockResult = {
  source: 'HANSEN_MOCK';
  futureSource: 'GLOBAL_FOREST_WATCH_HANSEN';
  datasetPlanned: string;
  mode: EudrValidationMode;
  cutoffDate: string;
  yearsChecked: number[];
  hectaresDeforested: number;
  confidence: MockConfidence;
  message: string;
};

@Injectable()
export class HansenService {
  private readonly plannedDataset =
    'UMD/hansen/global_forest_change_2024_v1_12';

  async analyzeFarm(input: AnalyzeFarmInput): Promise<HansenMockResult> {
    const mode = input.mode ?? EudrValidationMode.SEMI_AUTOMATIC;

    const hectaresDeforested =
      mode === EudrValidationMode.MOCK
        ? Number(input.mockHectaresDeforested ?? 0)
        : this.calculateSemiAutomaticRisk(input);

    return {
      source: 'HANSEN_MOCK',
      futureSource: 'GLOBAL_FOREST_WATCH_HANSEN',
      datasetPlanned: this.plannedDataset,
      mode,
      cutoffDate: EUDR_CUTOFF_DATE,
      yearsChecked: [2021, 2022, 2023, 2024],
      hectaresDeforested,
      confidence: this.getConfidence(input, mode),
      message:
        'Mock semiautomatico para demo. Esta implementacao sera substituida por consulta oficial ao Hansen/GFW.',
    };
  }

  private calculateSemiAutomaticRisk(input: AnalyzeFarmInput): number {
    if (!input.polygonGeoJson) {
      return 0.4;
    }

    const seed = Math.abs(
      Math.sin(input.latitude * 500 - input.longitude * 700),
    );

    if (seed < 0.6) {
      return 0;
    }

    if (seed < 0.88) {
      return 0.4;
    }

    return 1.6;
  }

  private getConfidence(
    input: AnalyzeFarmInput,
    mode: EudrValidationMode,
  ): MockConfidence {
    if (mode === EudrValidationMode.MOCK) {
      return 'MEDIUM';
    }

    if (!input.polygonGeoJson) {
      return 'LOW';
    }

    return 'HIGH';
  }
}
