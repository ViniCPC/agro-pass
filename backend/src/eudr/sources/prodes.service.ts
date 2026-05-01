import { Injectable } from '@nestjs/common';
import { EudrValidationMode } from '../dto/validate-farm.dto';
import { EUDR_CUTOFF_DATE } from '../eudr.constants';
import { AnalyzeFarmInput, MockConfidence } from './source-input.types';

export type ProdesMockResult = {
  source: 'PRODES_MOCK';
  futureSource: 'INPE_PRODES_API';
  datasetPlanned: string;
  mode: EudrValidationMode;
  cutoffDate: string;
  yearsChecked: number[];
  hectaresDeforested: number;
  confidence: MockConfidence;
  message: string;
};

@Injectable()
export class ProdesService {
  private readonly plannedDataset =
    'INPE/PRODES_AMAZONIA_2024_DEFORESTATION_POLYGONS';

  async analyzeFarm(input: AnalyzeFarmInput): Promise<ProdesMockResult> {
    const mode = input.mode ?? EudrValidationMode.SEMI_AUTOMATIC;

    const hectaresDeforested =
      mode === EudrValidationMode.MOCK
        ? Number(input.mockHectaresDeforested ?? 0)
        : this.calculateSemiAutomaticRisk(input);

    return {
      source: 'PRODES_MOCK',
      futureSource: 'INPE_PRODES_API',
      datasetPlanned: this.plannedDataset,
      mode,
      cutoffDate: EUDR_CUTOFF_DATE,
      yearsChecked: [2021, 2022, 2023, 2024],
      hectaresDeforested,
      confidence: this.getConfidence(input, mode),
      message:
        'Mock semiautomatico para demo. Esta implementacao sera substituida por consulta oficial ao PRODES.',
    };
  }

  private calculateSemiAutomaticRisk(input: AnalyzeFarmInput): number {
    if (!input.polygonGeoJson) {
      return 0.7;
    }

    const seed = Math.abs(Math.cos((input.latitude + input.longitude) * 900));

    if (seed < 0.55) {
      return 0;
    }

    if (seed < 0.82) {
      return 0.8;
    }

    return 1.9;
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
