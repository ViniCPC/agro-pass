import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type { Biome } from '../../generated/prisma/enums';

type SupportedMediaType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif';

export type CarData = {
  carNumber: string | null;
  farmName: string | null;
  ownerName: string | null;
  city: string | null;
  state: string | null;
  municipalityCode: string | null;
  biome: Biome | null;
  latitude: number | null;
  longitude: number | null;
  totalAreaHa: number | null;
  legalReserveAreaHa: number | null;
  appAreaHa: number | null;
  consolidatedAreaHa: number | null;
  confidence: number;
  confidenceReason: string | null;
  missingFields: string[];
  rawText: string | null;
  rawModelJson: Record<string, unknown> | null;
};

@Injectable()
export class CarParserService {
  private readonly anthropic: Anthropic;
  private readonly logger = new Logger(CarParserService.name);

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY nao foi definida no .env');
    }

    this.anthropic = new Anthropic({
      apiKey,
    });
  }

  async parseCarImage(buffer: Buffer): Promise<CarData> {
    try {
      const base64Image = buffer.toString('base64');
      const mediaType = this.detectMimeType(buffer);

      const message = await this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1500,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: this.buildPrompt(),
              },
            ],
          },
        ],
      });

      const textBlock = message.content.find((block) => block.type === 'text');

      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Resposta da IA nao veio em texto.');
      }

      const parsed = this.extractJson(textBlock.text);
      return this.normalizeCarData(parsed);
    } catch (error) {
      this.logger.error('Erro ao interpretar imagem do CAR', error);
      return this.emptyCarData();
    }
  }

  private buildPrompt(): string {
    return `
Voce e um assistente de extracao de dados do Cadastro Ambiental Rural (CAR), emitido no contexto do SICAR (Brasil).
O documento normalmente possui cabecalho do Governo Federal e estrutura padrao.

Analise a imagem enviada e extraia somente os dados legiveis.
Retorne EXCLUSIVAMENTE um JSON valido, sem markdown e sem texto extra.

Formato obrigatorio:
{
  "carNumber": string | null,
  "farmName": string | null,
  "ownerName": string | null,
  "city": string | null,
  "state": string | null,
  "municipalityCode": string | null,
  "biome": "AMAZON" | "CERRADO" | "ATLANTIC_FOREST" | "CAATINGA" | "PAMPA" | "PANTANAL" | null,
  "latitude": number | null,
  "longitude": number | null,
  "totalAreaHa": number | null,
  "legalReserveAreaHa": number | null,
  "appAreaHa": number | null,
  "consolidatedAreaHa": number | null,
  "confidence": number,
  "confidenceReason": string | null,
  "missingFields": string[],
  "extractedText": string | null
}

Regras importantes:
- Nao invente dados.
- Se nao tiver certeza, use null.
- confidence deve ser de 0 a 1.
- Use confidence abaixo de 0.7 se imagem ruim, cortada, escura ou com campos essenciais ausentes.
- Extraia estado em sigla (ex: MG, SP, MT, PA).
- Se achar coordenadas em DMS (ex: 23°32'18"S 46°38'34"W), converta para decimal quando possivel.
- O numero CAR geralmente segue: UF-CODIGO_MUNICIPIO_IBGE_7_DIGITOS-HASH_32_HEX.
- Exemplo de formato CAR: PA-1503903-9F37C31EC86E44C4B7F62BB30DBACB91
- Se municipalityCode nao estiver explicito, tente extrair do carNumber.
`;
  }

  private extractJson(text: string): unknown {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Nao foi possivel encontrar JSON na resposta da IA.');
    }

    const jsonText = text.slice(start, end + 1);
    return JSON.parse(jsonText);
  }

  private normalizeCarData(input: unknown): CarData {
    const value =
      input && typeof input === 'object' && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};

    const carNumber = this.toCarNumberOrNull(value.carNumber);
    const municipalityCode =
      this.toMunicipalityCode(value.municipalityCode) ??
      this.extractMunicipalityCodeFromCarNumber(carNumber);

    return {
      carNumber,
      farmName: this.toStringOrNull(value.farmName),
      ownerName: this.toStringOrNull(value.ownerName),
      city: this.toStringOrNull(value.city),
      state: this.toStateOrNull(value.state),
      municipalityCode,
      biome: this.toBiomeOrNull(value.biome),
      latitude: this.toNumberOrNull(value.latitude),
      longitude: this.toNumberOrNull(value.longitude),
      totalAreaHa: this.toNumberOrNull(value.totalAreaHa),
      legalReserveAreaHa: this.toNumberOrNull(value.legalReserveAreaHa),
      appAreaHa: this.toNumberOrNull(value.appAreaHa),
      consolidatedAreaHa: this.toNumberOrNull(value.consolidatedAreaHa),
      confidence: this.toConfidence(value.confidence),
      confidenceReason: this.toStringOrNull(value.confidenceReason),
      missingFields: Array.isArray(value.missingFields)
        ? value.missingFields.map(String)
        : [],
      rawText: this.toStringOrNull(value.extractedText),
      rawModelJson: this.toObjectOrNull(value) ?? null,
    };
  }

  private detectMimeType(buffer: Buffer): SupportedMediaType {
    if (
      buffer.length > 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return 'image/jpeg';
    }

    if (
      buffer.length > 7 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }

    if (
      buffer.length > 11 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }

    if (
      buffer.length > 5 &&
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46
    ) {
      return 'image/gif';
    }

    return 'image/jpeg';
  }

  private extractMunicipalityCodeFromCarNumber(
    carNumber: string | null,
  ): string | null {
    if (!carNumber) return null;
    const match = carNumber.match(/^[A-Z]{2}-(\d{7})-[A-Z0-9]{32}$/i);
    return match?.[1] ?? null;
  }

  private toCarNumberOrNull(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().replace(/\s+/g, '').toUpperCase();
    return normalized.length > 0 ? normalized : null;
  }

  private toStringOrNull(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toStateOrNull(value: unknown): string | null {
    const text = this.toStringOrNull(value);
    if (!text) return null;
    const normalized = text.toUpperCase();
    return normalized.length === 2 ? normalized : normalized.slice(0, 2);
  }

  private toMunicipalityCode(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const digits = value.replace(/\D/g, '');
    return digits.length === 7 ? digits : null;
  }

  private toBiomeOrNull(value: unknown): Biome | null {
    if (typeof value !== 'string') return null;

    const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized in BIOME_VALUES) {
      return normalized as Biome;
    }
    return null;
  }

  private toNumberOrNull(value: unknown): number | null {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(',', '.');
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  private toConfidence(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0;
    }

    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  private toObjectOrNull(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private emptyCarData(): CarData {
    return {
      carNumber: null,
      farmName: null,
      ownerName: null,
      city: null,
      state: null,
      municipalityCode: null,
      biome: null,
      latitude: null,
      longitude: null,
      totalAreaHa: null,
      legalReserveAreaHa: null,
      appAreaHa: null,
      consolidatedAreaHa: null,
      confidence: 0,
      confidenceReason: null,
      missingFields: [
        'carNumber',
        'farmName',
        'city',
        'state',
        'latitude',
        'longitude',
      ],
      rawText: null,
      rawModelJson: null,
    };
  }
}

const BIOME_VALUES = {
  AMAZON: true,
  CERRADO: true,
  ATLANTIC_FOREST: true,
  CAATINGA: true,
  PAMPA: true,
  PANTANAL: true,
} as const;
