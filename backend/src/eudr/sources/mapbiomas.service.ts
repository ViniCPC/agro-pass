import { Injectable } from '@nestjs/common';
import { EudrValidationMode } from '../dto/validate-farm.dto';
import { EUDR_CUTOFF_DATE } from '../eudr.constants';
import { AnalyzeFarmInput, MockConfidence } from './source-input.types';

export type MapBiomasMockResult = {
  source: 'MAPBIOMAS_MOCK';
  futureSource: 'GOOGLE_EARTH_ENGINE_MAPBIOMAS';
  assetPlanned: string;
  mode: EudrValidationMode;
  cutoffDate: string;
  yearsChecked: number[];
  checkedClasses: number[];
  hectaresDeforested: number;
  confidence: MockConfidence;
  message: string;
};

@Injectable()
export class MapBiomasService {
  private readonly plannedAsset =
    'projects/mapbiomas-public/assets/brazil/lulc/collection10_1/mapbiomas_brazil_collection10_1_deforestation_secondary_vegetation_v3';

  async analyzeFarm(input: AnalyzeFarmInput): Promise<MapBiomasMockResult> {
    const mode = input.mode ?? EudrValidationMode.SEMI_AUTOMATIC;

    const hectaresDeforested =
      mode === EudrValidationMode.MOCK
        ? Number(input.mockHectaresDeforested ?? 0)
        : this.calculateSemiAutomaticRisk(input);

    return {
      source: 'MAPBIOMAS_MOCK',
      futureSource: 'GOOGLE_EARTH_ENGINE_MAPBIOMAS',
      assetPlanned: this.plannedAsset,
      mode,
      cutoffDate: EUDR_CUTOFF_DATE,
      yearsChecked: [2021, 2022, 2023, 2024],
      checkedClasses: [4, 6],
      hectaresDeforested,
      confidence: this.getConfidence(input, mode),
      message:
        'Validação mockada/semiautomática para o hackathon. A arquitetura está preparada para substituir este serviço por consulta real ao MapBiomas via Google Earth Engine.',
    };
  }

  private calculateSemiAutomaticRisk(input: AnalyzeFarmInput): number {
    /**
     * Regra simples para o hackathon:
     *
     * - Se tiver polygonGeoJson, considera que há dado suficiente.
     * - Usa latitude/longitude para gerar um resultado determinístico.
     * - Não é aleatório. A mesma fazenda sempre retorna o mesmo resultado.
     *
     * Depois do hackathon, essa função será substituída pela consulta real ao Earth Engine.
     */

    if (!input.polygonGeoJson) {
      return 0.5;
    }

    const seed = Math.abs(
      Math.sin(input.latitude * 1000 + input.longitude * 1000),
    );

    if (seed < 0.65) {
      return 0;
    }

    if (seed < 0.85) {
      return 0.6;
    }

    return 2.3;
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
