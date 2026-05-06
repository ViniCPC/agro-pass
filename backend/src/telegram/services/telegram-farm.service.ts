import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '../../../generated/prisma/client';
import { Biome, DocumentType } from '../../../generated/prisma/enums';
import { CarData, CarParserService } from '../../ai/car-parser.service';
import { EudrValidationMode } from '../../eudr/dto/validate-farm.dto';
import { EudrValidateService } from '../../eudr/eudr-validate.service';
import { FarmsService } from '../../farms/farms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BotContext, extractTelegramId } from '../telegram.types';
import { Msg } from '../ui/telegram.messages';
import {
  FARM_CAR_CONFIRM_KEYBOARD,
  FARM_CAR_RETRY_KEYBOARD,
} from '../ui/telegram.keyboards';
import { TelegramAccountService } from './telegram-account.service';

@Injectable()
export class TelegramFarmService {
  private readonly logger = new Logger(TelegramFarmService.name);
  private static readonly DRAFT_TTL_MINUTES = 30;

  constructor(
    private readonly carParserService: CarParserService,
    private readonly accountService: TelegramAccountService,
    private readonly farmsService: FarmsService,
    private readonly eudrValidateService: EudrValidateService,
    private readonly prisma: PrismaService,
  ) {}

  async handleCarPhoto(ctx: BotContext): Promise<boolean> {
    const telegramUserId = extractTelegramId(ctx);
    if (!telegramUserId) {
      await ctx.reply(Msg.notLinked);
      return false;
    }

    const producer = await this.accountService.findByTelegramId(telegramUserId);
    if (!producer) {
      await ctx.reply(Msg.notLinked);
      return false;
    }

    const message = ctx.message;
    if (!message || !('photo' in message)) {
      await ctx.reply(Msg.farmRegistration.askCarPhoto);
      return false;
    }

    const bestPhoto = message.photo[message.photo.length - 1];
    if (!bestPhoto) {
      await ctx.reply(Msg.farmRegistration.askCarPhoto);
      return false;
    }

    await ctx.reply(Msg.farmRegistration.readingCar);

    let fileUrl: string | null = null;
    let imageBuffer: Buffer;
    try {
      const fileLink = await ctx.telegram.getFileLink(bestPhoto.file_id);
      fileUrl = fileLink.href;

      const response = await fetch(fileLink.href);
      if (!response.ok) {
        throw new Error(`Falha ao baixar imagem do Telegram: ${response.status}`);
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } catch (error) {
      this.logger.error('Erro ao baixar foto do CAR do Telegram', error);
      await ctx.reply(Msg.globalError);
      return false;
    }

    const carData = await this.carParserService.parseCarImage(imageBuffer);
    const hasMinimumData = this.hasMinimumData(carData);

    if (carData.confidence < 0.7 || !hasMinimumData) {
      await ctx.reply(
        Msg.farmRegistration.lowConfidence,
        FARM_CAR_RETRY_KEYBOARD,
      );
      return false;
    }

    const expiresAt = new Date(
      Date.now() + TelegramFarmService.DRAFT_TTL_MINUTES * 60_000,
    );
    const imageFileHash = createHash('sha256')
      .update(imageBuffer)
      .digest('hex');

    await this.prisma.carDraft.upsert({
      where: { telegramUserId },
      create: {
        telegramUserId,
        carData: carData as unknown as Prisma.InputJsonValue,
        imageUrl: fileUrl,
        imageFileHash,
        expiresAt,
      },
      update: {
        carData: carData as unknown as Prisma.InputJsonValue,
        imageUrl: fileUrl,
        imageFileHash,
        expiresAt,
      },
    });

    await ctx.reply(this.formatCarDataForConfirmation(carData), FARM_CAR_CONFIRM_KEYBOARD);
    await ctx.reply(Msg.farmRegistration.confirmButtonsHint);
    return true;
  }

  async handleConfirmCarData(ctx: BotContext): Promise<boolean> {
    const telegramUserId = extractTelegramId(ctx);
    if (!telegramUserId) {
      await ctx.reply(Msg.notLinked);
      return false;
    }

    const producer = await this.accountService.findByTelegramId(telegramUserId);
    if (!producer) {
      await ctx.reply(Msg.notLinked);
      return false;
    }

    const draft = await this.prisma.carDraft.findUnique({
      where: { telegramUserId },
    });

    if (!draft) {
      await ctx.reply(Msg.farmRegistration.noPendingDraft);
      return false;
    }

    if (draft.expiresAt.getTime() < Date.now()) {
      await this.prisma.carDraft.delete({
        where: { telegramUserId },
      });
      await ctx.reply(Msg.farmRegistration.draftExpired);
      return false;
    }

    const carData = this.parseDraftCarData(draft.carData);
    if (!carData || !this.hasMinimumData(carData)) {
      await ctx.reply(Msg.farmRegistration.noPendingDraft);
      return false;
    }

    try {
      const farmName = carData.farmName ?? `Fazenda ${producer.name}`;

      const farm = await this.farmsService.create({
        name: farmName,
        city: carData.city!,
        state: carData.state!,
        latitude: carData.latitude!,
        longitude: carData.longitude!,
        carNumber: carData.carNumber!,
        totalAreaHa: carData.totalAreaHa ?? undefined,
        legalReserveAreaHa: carData.legalReserveAreaHa ?? undefined,
        appAreaHa: carData.appAreaHa ?? undefined,
        consolidatedAreaHa: carData.consolidatedAreaHa ?? undefined,
        biome: carData.biome ?? undefined,
        producerId: producer.id,
        carRawJson: (carData.rawModelJson ?? carData) as object,
      });

      const fileUrl =
        draft.imageUrl ?? `/uploads/documents/telegram-car-${farm.id}.jpg`;
      let fileHash =
        draft.imageFileHash ??
        createHash('sha256')
          .update(`${telegramUserId}:${farm.id}:${Date.now()}`)
          .digest('hex');

      const existingDocument = await this.prisma.document.findUnique({
        where: { fileHash },
        select: { id: true },
      });

      if (existingDocument) {
        fileHash = createHash('sha256')
          .update(`${fileHash}:${farm.id}:${Date.now()}`)
          .digest('hex');
      }

      await this.prisma.document.create({
        data: {
          type: DocumentType.CAR,
          fileUrl,
          fileHash,
          farmId: farm.id,
        },
      });

      await this.prisma.carDraft.delete({
        where: { telegramUserId },
      });

      await ctx.reply(Msg.farmRegistration.createdAndValidating);

      void this.eudrValidateService
        .validateFarm(farm.id, {
          mode: EudrValidationMode.SEMI_AUTOMATIC,
          notes: 'Validation triggered from Telegram CAR confirmation flow.',
        })
        .catch((error) => {
          this.logger.error(
            `Erro ao disparar validacao EUDR automatica para fazenda ${farm.id}`,
            error,
          );
        });

      return true;
    } catch (error) {
      this.logger.error('Erro ao confirmar dados do CAR no Telegram', error);
      await ctx.reply(Msg.globalError);
      return false;
    }
  }

  private hasMinimumData(carData: CarData): boolean {
    return Boolean(
      carData.carNumber &&
        carData.city &&
        carData.state &&
        carData.latitude != null &&
        carData.longitude != null,
    );
  }

  private parseDraftCarData(raw: Prisma.JsonValue): CarData | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return null;
    }

    const value = raw as Record<string, unknown>;

    return {
      carNumber: this.toStringOrNull(value.carNumber),
      farmName: this.toStringOrNull(value.farmName),
      ownerName: this.toStringOrNull(value.ownerName),
      city: this.toStringOrNull(value.city),
      state: this.toStringOrNull(value.state),
      municipalityCode: this.toMunicipalityCode(value.municipalityCode),
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
      rawText: this.toStringOrNull(value.rawText),
      rawModelJson: this.toObjectOrNull(value.rawModelJson),
    };
  }

  private formatCarDataForConfirmation(carData: CarData): string {
    return (
      'Encontrei estes dados no CAR:\n\n' +
      `CAR: ${carData.carNumber ?? 'Nao identificado'}\n` +
      `Fazenda: ${carData.farmName ?? 'Nao identificada'}\n` +
      `Proprietario: ${carData.ownerName ?? 'Nao identificado'}\n` +
      `Municipio: ${carData.city ?? 'Nao identificado'}\n` +
      `UF: ${carData.state ?? 'Nao identificado'}\n` +
      `Codigo IBGE: ${carData.municipalityCode ?? 'Nao identificado'}\n` +
      `Bioma: ${this.formatBiome(carData.biome)}\n` +
      `Latitude: ${this.formatNumber(carData.latitude)}\n` +
      `Longitude: ${this.formatNumber(carData.longitude)}\n` +
      `Area total: ${this.formatNumber(carData.totalAreaHa, 'ha')}\n` +
      `Reserva legal: ${this.formatNumber(carData.legalReserveAreaHa, 'ha')}\n` +
      `APP: ${this.formatNumber(carData.appAreaHa, 'ha')}\n` +
      `Area consolidada: ${this.formatNumber(carData.consolidatedAreaHa, 'ha')}\n\n` +
      `Confianca da leitura: ${(carData.confidence * 100).toFixed(0)}%\n` +
      (carData.confidenceReason
        ? `Motivo da confianca: ${carData.confidenceReason}\n\n`
        : '\n')
    );
  }

  private formatBiome(biome: Biome | null): string {
    if (!biome) return 'Nao identificado';
    const labels: Record<Biome, string> = {
      AMAZON: 'Amazonia',
      CERRADO: 'Cerrado',
      ATLANTIC_FOREST: 'Mata Atlantica',
      CAATINGA: 'Caatinga',
      PAMPA: 'Pampa',
      PANTANAL: 'Pantanal',
    };
    return labels[biome];
  }

  private formatNumber(value: number | null, suffix?: string): string {
    if (value == null) return 'Nao identificado';
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(6);
    return suffix ? `${formatted} ${suffix}` : formatted;
  }

  private toStringOrNull(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toMunicipalityCode(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const digits = value.replace(/\D/g, '');
    return digits.length === 7 ? digits : null;
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

  private toBiomeOrNull(value: unknown): Biome | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized in Biome) {
      return normalized as Biome;
    }
    return null;
  }

  private toObjectOrNull(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private toConfidence(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0;
    }
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
}
