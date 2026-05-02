import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FarmStatus, ValidationStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { EudrService } from './eudr.service';
import { EudrValidationMode, ValidateFarmDto } from './dto/validate-farm.dto';
import { HansenService } from './sources/hansen.service';
import { MapBiomasService } from './sources/mapbiomas.service';
import { ProdesService } from './sources/prodes.service';
import { SentinelService } from './sources/sentinel.service';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeFarm(overrides: Record<string, unknown> = {}) {
  return {
    id: 'farm-uuid',
    name: 'Fazenda Test',
    city: 'Rio Verde',
    state: 'GO',
    latitude: -17.79,
    longitude: -50.93,
    polygonGeoJson: null,
    carNumber: null,
    status: FarmStatus.PENDING,
    lastValidationId: null,
    lastValidation: null,
    producer: { id: 'producer-uuid', name: 'João', document: '12345678901' },
    ...overrides,
  };
}

function makeValidation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'validation-uuid',
    farmId: 'farm-uuid',
    status: ValidationStatus.COMPLIANT,
    cutoffDate: new Date('2020-12-31T00:00:00Z'),
    hectaresDeforested: 0,
    mapBiomasResult: null,
    prodesResult: null,
    hansenResult: null,
    satelliteImageBeforeUrl: 'https://mock/before.png',
    satelliteImageAfterUrl: 'https://mock/after.png',
    ndviBefore: 0.6,
    ndviAfter: 0.58,
    evidenceHash: 'sha256hash',
    validatedAt: new Date(),
    validUntil: new Date(),
    ...overrides,
  };
}

function makeSourceResult(hectaresDeforested: number) {
  return { hectaresDeforested, source: 'MOCK', mode: EudrValidationMode.MOCK };
}

function makeSentinelResult() {
  return {
    satelliteImageBeforeUrl: 'https://mock-eo.agropass.dev/sentinel2/farm-uuid/before_2020-12-31.png',
    satelliteImageAfterUrl: 'https://mock-eo.agropass.dev/sentinel2/farm-uuid/after_2025-01-01.png',
    ndviBefore: 0.6,
    ndviAfter: 0.55,
    ndviDelta: -0.05,
    source: 'SENTINEL2_MOCK',
    mode: EudrValidationMode.SEMI_AUTOMATIC,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('EudrService', () => {
  let service: EudrService;

  let farmFindUnique: jest.Mock;
  let farmUpdate: jest.Mock;
  let eudrValidationCreate: jest.Mock;
  let eudrValidationFindMany: jest.Mock;
  let eudrValidationCount: jest.Mock;
  let $transaction: jest.Mock;

  let mapBiomasAnalyze: jest.Mock;
  let prodesAnalyze: jest.Mock;
  let hansenAnalyze: jest.Mock;
  let sentinelAnalyze: jest.Mock;

  beforeEach(async () => {
    farmFindUnique = jest.fn();
    farmUpdate = jest.fn();
    eudrValidationCreate = jest.fn();
    eudrValidationFindMany = jest.fn();
    eudrValidationCount = jest.fn();

    // $transaction: if called with an array, resolve all; if called with a callback, execute it
    $transaction = jest.fn().mockImplementation((arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return (arg as (tx: unknown) => unknown)({
        eudrValidation: { create: eudrValidationCreate },
        farm: { update: farmUpdate },
      });
    });

    mapBiomasAnalyze = jest.fn();
    prodesAnalyze = jest.fn();
    hansenAnalyze = jest.fn();
    sentinelAnalyze = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        EudrService,
        {
          provide: PrismaService,
          useValue: {
            farm: { findUnique: farmFindUnique, update: farmUpdate },
            eudrValidation: {
              create: eudrValidationCreate,
              findMany: eudrValidationFindMany,
              count: eudrValidationCount,
            },
            $transaction,
          },
        },
        { provide: MapBiomasService, useValue: { analyzeFarm: mapBiomasAnalyze } },
        { provide: ProdesService, useValue: { analyzeFarm: prodesAnalyze } },
        { provide: HansenService, useValue: { analyzeFarm: hansenAnalyze } },
        { provide: SentinelService, useValue: { analyzeFarm: sentinelAnalyze } },
      ],
    }).compile();

    service = module.get(EudrService);
  });

  // ─── validateFarm ──────────────────────────────────────────────────────────

  describe('validateFarm', () => {
    it('lança NotFoundException quando a fazenda não existe', async () => {
      farmFindUnique.mockResolvedValue(null);

      await expect(
        service.validateFarm('farm-uuid', {} as ValidateFarmDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException ao usar mockHectaresDeforested com SEMI_AUTOMATIC', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());

      await expect(
        service.validateFarm('farm-uuid', {
          mode: EudrValidationMode.SEMI_AUTOMATIC,
          mockHectaresDeforested: 1.5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando a fazenda não tem coordenadas', async () => {
      farmFindUnique.mockResolvedValue(
        makeFarm({ latitude: null, longitude: null }),
      );

      await expect(
        service.validateFarm('farm-uuid', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('retorna COMPLIANT e FarmStatus APPROVED quando hectaresDeforested = 0', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      mapBiomasAnalyze.mockResolvedValue(makeSourceResult(0));
      prodesAnalyze.mockResolvedValue(makeSourceResult(0));
      hansenAnalyze.mockResolvedValue(makeSourceResult(0));
      sentinelAnalyze.mockResolvedValue(makeSentinelResult());
      eudrValidationCreate.mockResolvedValue(
        makeValidation({ status: ValidationStatus.COMPLIANT, hectaresDeforested: 0 }),
      );

      const result = await service.validateFarm('farm-uuid', { mode: EudrValidationMode.MOCK, mockHectaresDeforested: 0 });

      expect(result.status).toBe(ValidationStatus.COMPLIANT);
      expect(result.farmStatus).toBe(FarmStatus.APPROVED);
      expect(result.hectaresDeforested).toBe(0);
    });

    it('retorna NEEDS_REVIEW e FarmStatus PENDING quando hectaresDeforested está entre 0 e 1', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      mapBiomasAnalyze.mockResolvedValue(makeSourceResult(0.6));
      prodesAnalyze.mockResolvedValue(makeSourceResult(0.6));
      hansenAnalyze.mockResolvedValue(makeSourceResult(0.6));
      sentinelAnalyze.mockResolvedValue(makeSentinelResult());
      eudrValidationCreate.mockResolvedValue(
        makeValidation({ status: ValidationStatus.NEEDS_REVIEW, hectaresDeforested: 0.6 }),
      );

      const result = await service.validateFarm('farm-uuid', { mode: EudrValidationMode.MOCK, mockHectaresDeforested: 0.6 });

      expect(result.status).toBe(ValidationStatus.NEEDS_REVIEW);
      expect(result.farmStatus).toBe(FarmStatus.PENDING);
    });

    it('retorna NON_COMPLIANT e FarmStatus REJECTED quando hectaresDeforested >= 1', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      mapBiomasAnalyze.mockResolvedValue(makeSourceResult(2));
      prodesAnalyze.mockResolvedValue(makeSourceResult(2));
      hansenAnalyze.mockResolvedValue(makeSourceResult(2));
      sentinelAnalyze.mockResolvedValue(makeSentinelResult());
      eudrValidationCreate.mockResolvedValue(
        makeValidation({ status: ValidationStatus.NON_COMPLIANT, hectaresDeforested: 2 }),
      );

      const result = await service.validateFarm('farm-uuid', { mode: EudrValidationMode.MOCK, mockHectaresDeforested: 2 });

      expect(result.status).toBe(ValidationStatus.NON_COMPLIANT);
      expect(result.farmStatus).toBe(FarmStatus.REJECTED);
    });

    it('calcula a média dos hectares das três fontes corretamente', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      // média de 0, 0.6, 1.8 = 0.8 → NEEDS_REVIEW
      mapBiomasAnalyze.mockResolvedValue(makeSourceResult(0));
      prodesAnalyze.mockResolvedValue(makeSourceResult(0.6));
      hansenAnalyze.mockResolvedValue(makeSourceResult(1.8));
      sentinelAnalyze.mockResolvedValue(makeSentinelResult());
      eudrValidationCreate.mockResolvedValue(
        makeValidation({ status: ValidationStatus.NEEDS_REVIEW, hectaresDeforested: 0.8 }),
      );

      const result = await service.validateFarm('farm-uuid', { mode: EudrValidationMode.MOCK, mockHectaresDeforested: 0.8 });

      expect(result.hectaresDeforested).toBe(0.8);
    });

    it('inclui satelliteImageBeforeUrl, satelliteImageAfterUrl, ndviBefore e ndviAfter no retorno', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      mapBiomasAnalyze.mockResolvedValue(makeSourceResult(0));
      prodesAnalyze.mockResolvedValue(makeSourceResult(0));
      hansenAnalyze.mockResolvedValue(makeSourceResult(0));
      sentinelAnalyze.mockResolvedValue(makeSentinelResult());
      eudrValidationCreate.mockResolvedValue(makeValidation());

      const result = await service.validateFarm('farm-uuid', { mode: EudrValidationMode.MOCK, mockHectaresDeforested: 0 });

      expect(result.satelliteImageBeforeUrl).toBeDefined();
      expect(result.satelliteImageAfterUrl).toBeDefined();
      expect(typeof result.ndviBefore).toBe('number');
      expect(typeof result.ndviAfter).toBe('number');
    });

    it('salva satelliteImageBeforeUrl e ndvi no eudrValidation.create', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      mapBiomasAnalyze.mockResolvedValue(makeSourceResult(0));
      prodesAnalyze.mockResolvedValue(makeSourceResult(0));
      hansenAnalyze.mockResolvedValue(makeSourceResult(0));
      const sentinel = makeSentinelResult();
      sentinelAnalyze.mockResolvedValue(sentinel);
      eudrValidationCreate.mockResolvedValue(makeValidation());

      await service.validateFarm('farm-uuid', { mode: EudrValidationMode.MOCK, mockHectaresDeforested: 0 });

      expect(eudrValidationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            satelliteImageBeforeUrl: sentinel.satelliteImageBeforeUrl,
            satelliteImageAfterUrl: sentinel.satelliteImageAfterUrl,
            ndviBefore: sentinel.ndviBefore,
            ndviAfter: sentinel.ndviAfter,
          }),
        }),
      );
    });

    it('usa SEMI_AUTOMATIC como modo padrão quando mode não é informado', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      mapBiomasAnalyze.mockResolvedValue(makeSourceResult(0));
      prodesAnalyze.mockResolvedValue(makeSourceResult(0));
      hansenAnalyze.mockResolvedValue(makeSourceResult(0));
      sentinelAnalyze.mockResolvedValue(makeSentinelResult());
      eudrValidationCreate.mockResolvedValue(makeValidation());

      await service.validateFarm('farm-uuid', {});

      const callArg = sentinelAnalyze.mock.calls[0][0];
      expect(callArg.mode).toBe(EudrValidationMode.SEMI_AUTOMATIC);
    });
  });

  // ─── getLastValidation ─────────────────────────────────────────────────────

  describe('getLastValidation', () => {
    it('lança NotFoundException quando a fazenda não existe', async () => {
      farmFindUnique.mockResolvedValue(null);

      await expect(service.getLastValidation('farm-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna mensagem de sem validação quando lastValidation é null', async () => {
      farmFindUnique.mockResolvedValue(makeFarm({ lastValidation: null }));

      const result = await service.getLastValidation('farm-uuid');

      expect(result.lastValidation).toBeNull();
      expect(result.message).toBeDefined();
    });

    it('retorna EudrValidationDto quando lastValidation existe', async () => {
      const validation = makeValidation();
      farmFindUnique.mockResolvedValue(makeFarm({ lastValidation: validation }));

      const result = await service.getLastValidation('farm-uuid');

      expect(result.lastValidation).not.toBeNull();
      expect(result.lastValidation?.id).toBe(validation.id);
      expect(result.lastValidation?.status).toBe(ValidationStatus.COMPLIANT);
    });
  });

  // ─── getValidationHistory ──────────────────────────────────────────────────

  describe('getValidationHistory', () => {
    it('lança NotFoundException quando a fazenda não existe', async () => {
      farmFindUnique.mockResolvedValue(null);

      await expect(
        service.getValidationHistory('farm-uuid', 1, 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('retorna lista paginada de validações', async () => {
      farmFindUnique.mockResolvedValue(
        makeFarm({ id: 'farm-uuid', name: 'Fazenda Test', status: FarmStatus.APPROVED }),
      );
      eudrValidationFindMany.mockResolvedValue([makeValidation(), makeValidation({ id: 'v2' })]);
      eudrValidationCount.mockResolvedValue(2);

      const result = await service.getValidationHistory('farm-uuid', 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('calcula totalPages corretamente para múltiplas páginas', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      eudrValidationFindMany.mockResolvedValue([makeValidation()]);
      eudrValidationCount.mockResolvedValue(25);

      const result = await service.getValidationHistory('farm-uuid', 1, 10);

      expect(result.pagination.totalPages).toBe(3);
    });

    it('retorna totalPages mínimo de 1 mesmo sem registros', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      eudrValidationFindMany.mockResolvedValue([]);
      eudrValidationCount.mockResolvedValue(0);

      const result = await service.getValidationHistory('farm-uuid', 1, 10);

      expect(result.pagination.totalPages).toBe(1);
    });
  });
});
