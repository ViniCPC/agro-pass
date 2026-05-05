import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { EudrValidationMode } from '../dto/validate-farm.dto';
import { EUDR_CUTOFF_DATE } from '../eudr.constants';
import { AnalyzeFarmInput, MockConfidence } from './source-input.types';

export type MapBiomasComplianceStatus =
  | 'COMPLIANT'
  | 'REVIEW_REQUIRED'
  | 'NON_COMPLIANT';

export type MapBiomasAlert = {
  code: string;
  year: number;
  areaHa: number;
  description: string;
};

export type MapBiomasResult = {
  source: 'MAPBIOMAS';
  executionMode: EudrValidationMode;

  futureSource: 'GOOGLE_EARTH_ENGINE_MAPBIOMAS';
  assetPlanned: string;

  farmId: string;
  cutoffDate: string;
  yearsChecked: number[];

  status: MapBiomasComplianceStatus;
  hectaresDeforested: number;
  alertCount: number;
  alerts: MapBiomasAlert[];

  confidence: MockConfidence;
  evidenceHash: string;

  checkedAt: string;
  message: string;
};

@Injectable()
export class MapBiomasService {
  private readonly plannedAsset =
    'projects/mapbiomas-public/assets/brazil/lulc/collection10_1/mapbiomas_brazil_collection10_1_deforestation_secondary_vegetation_v3';

  async analyzeFarm(input: AnalyzeFarmInput): Promise<MapBiomasResult> {
    const mode = input.mode ?? EudrValidationMode.SEMI_AUTOMATIC;
    const checkedAt = new Date().toISOString();

    const hectaresDeforested = this.calculateHectaresDeforested(input, mode);
    const status = this.calculateStatus(hectaresDeforested);
    const confidence = this.getConfidence(input, mode);
    const alerts = this.buildAlerts(hectaresDeforested);

    const resultWithoutHash = {
      source: 'MAPBIOMAS' as const,
      executionMode: mode,

      futureSource: 'GOOGLE_EARTH_ENGINE_MAPBIOMAS' as const,
      assetPlanned: this.plannedAsset,

      farmId: input.farmId,
      cutoffDate: EUDR_CUTOFF_DATE,
      yearsChecked: [2021, 2022, 2023, 2024],

      status,
      hectaresDeforested,
      alertCount: alerts.length,
      alerts,

      confidence,

      checkedAt,
      message:
        'Validação MapBiomas em modo mockado/semiautomático para o hackathon. A arquitetura está pronta para substituir este adapter por consulta real via Google Earth Engine.',
    };

    const evidenceHash = this.generateEvidenceHash(resultWithoutHash);

    return {
      ...resultWithoutHash,
      evidenceHash,
    };
  }

  private calculateHectaresDeforested(
    input: AnalyzeFarmInput,
    mode: EudrValidationMode,
  ): number {
    if (mode === EudrValidationMode.MOCK) {
      return Number(input.mockHectaresDeforested ?? 0);
    }

    return this.calculateSemiAutomaticRisk(input);
  }

  private calculateSemiAutomaticRisk(input: AnalyzeFarmInput): number {
    /**
     * Regra determinística para o hackathon:
     *
     * - Não usa random.
     * - A mesma fazenda sempre retorna o mesmo resultado.
     * - Se não tiver polygonGeoJson, a confiança será baixa.
     * - Depois do hackathon, essa função será substituída por consulta real ao GEE.
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

  private calculateStatus(
    hectaresDeforested: number,
  ): MapBiomasComplianceStatus {
    if (hectaresDeforested <= 0) {
      return 'COMPLIANT';
    }

    if (hectaresDeforested < 1) {
      return 'REVIEW_REQUIRED';
    }

    return 'NON_COMPLIANT';
  }

  private buildAlerts(hectaresDeforested: number): MapBiomasAlert[] {
    if (hectaresDeforested <= 0) {
      return [];
    }

    if (hectaresDeforested < 1) {
      return [
        {
          code: 'MB-DEMO-REVIEW-001',
          year: 2024,
          areaHa: hectaresDeforested,
          description:
            'Possível supressão de vegetação detectada. Revisão manual recomendada.',
        },
      ];
    }

    return [
      {
        code: 'MB-DEMO-NON-COMPLIANT-001',
        year: 2023,
        areaHa: hectaresDeforested,
        description:
          'Área com indício relevante de desmatamento após a data de corte EUDR.',
      },
    ];
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

  private generateEvidenceHash(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }
}
