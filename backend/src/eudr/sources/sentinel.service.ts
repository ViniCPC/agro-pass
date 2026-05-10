import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { EudrValidationMode } from '../dto/validate-farm.dto';
import { EUDR_CUTOFF_DATE } from '../eudr.constants';
import { AnalyzeFarmInput, MockConfidence } from './source-input.types';

type SatelliteProvider = 'MOCK' | 'SENTINEL_HUB';

export type SentinelMockResult = {
  source: 'SENTINEL2_MOCK' | 'SENTINEL2_SENTINEL_HUB';
  futureSource: 'COPERNICUS_SENTINEL2';
  apiPlanned: string;
  provider: SatelliteProvider;
  fallbackUsed: boolean;
  mode: EudrValidationMode;
  cutoffDate: string;
  satelliteImageBeforeUrl: string | null;
  satelliteImageAfterUrl: string | null;
  ndviBefore: number;
  ndviAfter: number;
  ndviDelta: number;
  confidence: MockConfidence;
  message: string;
};

const AFTER_DATE = new Date().toISOString().slice(0, 10);
const DEFAULT_TOKEN_URL =
  'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token';
const DEFAULT_PROCESS_URL = 'https://services.sentinel-hub.com/api/v1/process';
const TRUE_COLOR_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B03", "B02", "dataMask"],
    output: { bands: 4, sampleType: "AUTO" }
  };
}

function evaluatePixel(sample) {
  return [
    2.5 * sample.B04,
    2.5 * sample.B03,
    2.5 * sample.B02,
    sample.dataMask
  ];
}`;

@Injectable()
export class SentinelService {
  private readonly logger = new Logger(SentinelService.name);
  private readonly plannedApi =
    'https://services.sentinel-hub.com/api/v1/process (Sentinel Hub Processing API)';
  private tokenCache: { accessToken: string; expiresAt: number } | null = null;

  async analyzeFarm(input: AnalyzeFarmInput): Promise<SentinelMockResult> {
    const mode = input.mode ?? EudrValidationMode.SEMI_AUTOMATIC;
    const provider = this.getProvider();

    const { ndviBefore, ndviAfter } =
      mode === EudrValidationMode.MOCK
        ? this.getMockNdvi()
        : this.calculateSemiAutomaticNdvi(input);

    if (provider === 'SENTINEL_HUB') {
      try {
        const imagery = await this.fetchSentinelHubImagery(input);

        return this.buildResult({
          source: 'SENTINEL2_SENTINEL_HUB',
          provider,
          fallbackUsed: false,
          mode,
          satelliteImageBeforeUrl: imagery.beforeUrl,
          satelliteImageAfterUrl: imagery.afterUrl,
          ndviBefore,
          ndviAfter,
          confidence: this.getConfidence(input, mode, provider),
          message:
            'Imagens Sentinel-2 reais obtidas via Sentinel Hub. NDVI e classificacao seguem o modo semiautomatico do MVP.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.warn(
          `Falha ao buscar imagens reais no Sentinel Hub. Usando fallback mock: ${message}`,
        );
      }
    }

    const satelliteImageBeforeUrl = null;
    const satelliteImageAfterUrl = null;

    return this.buildResult({
      source: 'SENTINEL2_MOCK',
      provider: 'MOCK',
      fallbackUsed: provider === 'SENTINEL_HUB',
      mode,
      satelliteImageBeforeUrl,
      satelliteImageAfterUrl,
      ndviBefore,
      ndviAfter,
      confidence: this.getConfidence(input, mode, 'MOCK'),
      message:
        provider === 'SENTINEL_HUB'
          ? 'Fallback mock acionado porque a consulta real ao Sentinel Hub falhou ou nao esta configurada.'
          : 'Mock semiautomatico para demo. Sera substituido por consulta real ao Sentinel Hub / Copernicus.',
    });
  }

  private buildResult(input: {
    source: SentinelMockResult['source'];
    provider: SatelliteProvider;
    fallbackUsed: boolean;
    mode: EudrValidationMode;
    satelliteImageBeforeUrl: string | null;
    satelliteImageAfterUrl: string | null;
    ndviBefore: number;
    ndviAfter: number;
    confidence: MockConfidence;
    message: string;
  }): SentinelMockResult {
    return {
      source: input.source,
      futureSource: 'COPERNICUS_SENTINEL2',
      apiPlanned: this.plannedApi,
      provider: input.provider,
      fallbackUsed: input.fallbackUsed,
      mode: input.mode,
      cutoffDate: EUDR_CUTOFF_DATE,
      satelliteImageBeforeUrl: input.satelliteImageBeforeUrl,
      satelliteImageAfterUrl: input.satelliteImageAfterUrl,
      ndviBefore: input.ndviBefore,
      ndviAfter: input.ndviAfter,
      ndviDelta: Number((input.ndviAfter - input.ndviBefore).toFixed(3)),
      confidence: input.confidence,
      message: input.message,
    };
  }

  private getMockNdvi(): { ndviBefore: number; ndviAfter: number } {
    return { ndviBefore: 0.65, ndviAfter: 0.62 };
  }

  private calculateSemiAutomaticNdvi(input: AnalyzeFarmInput): {
    ndviBefore: number;
    ndviAfter: number;
  } {
    const seed = Math.abs(
      Math.sin(input.latitude * 300 + input.longitude * 500),
    );

    // ndviBefore: healthy baseline between 0.45 and 0.75
    const ndviBefore = Number((0.45 + seed * 0.3).toFixed(3));

    // ndviAfter: drops proportionally to deforestation seed
    const dropFactor = seed < 0.5 ? 0.02 : seed < 0.8 ? 0.08 : 0.22;
    const ndviAfter = Number(
      Math.max(0.1, ndviBefore - dropFactor).toFixed(3),
    );

    return { ndviBefore, ndviAfter };
  }

  private getConfidence(
    input: AnalyzeFarmInput,
    mode: EudrValidationMode,
    provider: SatelliteProvider,
  ): MockConfidence {
    if (mode === EudrValidationMode.MOCK) {
      return 'MEDIUM';
    }

    if (provider === 'SENTINEL_HUB') {
      return input.polygonGeoJson ? 'HIGH' : 'MEDIUM';
    }

    if (!input.polygonGeoJson) {
      return 'LOW';
    }

    return 'HIGH';
  }

  private getProvider(): SatelliteProvider {
    return process.env.SATELLITE_PROVIDER === 'SENTINEL_HUB'
      ? 'SENTINEL_HUB'
      : 'MOCK';
  }

  private async fetchSentinelHubImagery(
    input: AnalyzeFarmInput,
  ): Promise<{ beforeUrl: string; afterUrl: string }> {
    const clientId = process.env.SENTINEL_HUB_CLIENT_ID;
    const clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'SENTINEL_HUB_CLIENT_ID/SENTINEL_HUB_CLIENT_SECRET nao configurados',
      );
    }

    const accessToken = await this.getSentinelHubAccessToken(
      clientId,
      clientSecret,
    );
    const [beforeUrl, afterUrl] = await Promise.all([
      this.fetchAndStoreImage({
        input,
        accessToken,
        label: 'before',
        from: '2020-12-01T00:00:00Z',
        to: '2020-12-31T23:59:59Z',
      }),
      this.fetchAndStoreImage({
        input,
        accessToken,
        label: 'after',
        from: this.daysAgoIso(90),
        to: `${AFTER_DATE}T23:59:59Z`,
      }),
    ]);

    return { beforeUrl, afterUrl };
  }

  private async getSentinelHubAccessToken(
    clientId: string,
    clientSecret: string,
  ): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 30_000) {
      return this.tokenCache.accessToken;
    }

    const tokenUrl = process.env.SENTINEL_HUB_TOKEN_URL ?? DEFAULT_TOKEN_URL;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`Token Sentinel Hub falhou: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      throw new Error('Token Sentinel Hub sem access_token');
    }

    this.tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 300) * 1000,
    };

    return data.access_token;
  }

  private async fetchAndStoreImage(input: {
    input: AnalyzeFarmInput;
    accessToken: string;
    label: 'before' | 'after';
    from: string;
    to: string;
  }): Promise<string> {
    const processUrl =
      process.env.SENTINEL_HUB_PROCESS_URL ?? DEFAULT_PROCESS_URL;
    const response = await fetch(processUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'image/png',
      },
      body: JSON.stringify(
        this.buildProcessRequest(input.input, input.from, input.to),
      ),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(
        `Process API Sentinel Hub falhou (${input.label}): ${response.status} ${text}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const uploadDir = join(process.cwd(), 'uploads', 'satellite');
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${input.input.farmId}-${input.label}-${input.to.slice(
      0,
      10,
    )}.png`;
    await writeFile(join(uploadDir, fileName), buffer);

    return `/uploads/satellite/${fileName}`;
  }

  private buildProcessRequest(
    input: AnalyzeFarmInput,
    from: string,
    to: string,
  ) {
    return {
      input: {
        bounds: {
          bbox: this.buildPointBbox(input.latitude, input.longitude),
        },
        data: [
          {
            type: 'sentinel-2-l2a',
            dataFilter: {
              timeRange: { from, to },
              maxCloudCoverage: 40,
            },
          },
        ],
      },
      output: {
        width: 512,
        height: 512,
        responses: [
          {
            identifier: 'default',
            format: { type: 'image/png' },
          },
        ],
      },
      evalscript: TRUE_COLOR_EVALSCRIPT,
    };
  }

  private buildPointBbox(latitude: number, longitude: number): number[] {
    const delta = Number(process.env.SENTINEL_HUB_BBOX_DEGREES ?? 0.015);
    return [
      Number((longitude - delta).toFixed(6)),
      Number((latitude - delta).toFixed(6)),
      Number((longitude + delta).toFixed(6)),
      Number((latitude + delta).toFixed(6)),
    ];
  }

  private daysAgoIso(days: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return `${date.toISOString().slice(0, 10)}T00:00:00Z`;
  }
}