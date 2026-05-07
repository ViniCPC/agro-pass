import { Test } from '@nestjs/testing';
import { Biome } from '../../../generated/prisma/enums';
import { CarData, CarParserService } from '../../ai/car-parser.service';
import { EudrValidateService } from '../../eudr/eudr-validate.service';
import { FarmsService } from '../../farms/farms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Msg } from '../ui/telegram.messages';
import { TelegramAccountService } from './telegram-account.service';
import { TelegramFarmService } from './telegram-farm.service';

describe('TelegramFarmService', () => {
  let service: TelegramFarmService;

  const parseCarImage = jest.fn();
  const findByTelegramId = jest.fn();
  const createFarm = jest.fn();
  const validateFarm = jest.fn();

  const draftUpsert = jest.fn();
  const draftFindUnique = jest.fn();
  const draftDelete = jest.fn();
  const documentFindUnique = jest.fn();
  const documentCreate = jest.fn();

  const originalFetch = global.fetch;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        TelegramFarmService,
        {
          provide: CarParserService,
          useValue: {
            parseCarImage,
          },
        },
        {
          provide: TelegramAccountService,
          useValue: {
            findByTelegramId,
          },
        },
        {
          provide: FarmsService,
          useValue: {
            create: createFarm,
          },
        },
        {
          provide: EudrValidateService,
          useValue: {
            validateFarm,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            carDraft: {
              upsert: draftUpsert,
              findUnique: draftFindUnique,
              delete: draftDelete,
            },
            document: {
              findUnique: documentFindUnique,
              create: documentCreate,
            },
          },
        },
      ],
    }).compile();

    service = module.get(TelegramFarmService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function makeContext(overrides: Record<string, unknown> = {}) {
    return {
      from: { id: 123456 },
      reply: jest.fn().mockResolvedValue(undefined),
      telegram: {
        getFileLink: jest.fn().mockResolvedValue({
          href: 'https://api.telegram.org/file/botSECRET_TOKEN/photos/car.jpg',
        }),
      },
      message: {
        photo: [{ file_id: 'file-small' }, { file_id: 'file-best' }],
      },
      ...overrides,
    } as any;
  }

  function validCarData(): CarData {
    return {
      carNumber: 'PA-1503903-9F37C31EC86E44C4B7F62BB30DBACB91',
      farmName: 'Fazenda Boa Vista',
      ownerName: 'Maria da Silva',
      city: 'Belém',
      state: 'PA',
      municipalityCode: '1503903',
      biome: Biome.AMAZON,
      latitude: -1.4558,
      longitude: -48.4902,
      totalAreaHa: 100,
      legalReserveAreaHa: 80,
      appAreaHa: 5,
      consolidatedAreaHa: 15,
      confidence: 0.92,
      confidenceReason: 'Campos principais legíveis.',
      missingFields: [],
      rawText: 'Texto OCR',
      rawModelJson: { ok: true },
    };
  }

  it('handleCarPhoto persiste draft com referência segura e retorna true', async () => {
    const ctx = makeContext();
    findByTelegramId.mockResolvedValue({ id: 'producer-1' });
    parseCarImage.mockResolvedValue(validCarData());
    draftUpsert.mockResolvedValue(undefined);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('fake-image'),
    } as any);

    const result = await service.handleCarPhoto(ctx);

    expect(result).toBe(true);
    expect(draftUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          imageUrl: 'telegram://file/file-best',
        }),
      }),
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Encontrei estes dados no CAR'),
      expect.any(Object),
    );
  });

  it('handleCarPhoto retorna false quando confiança é baixa', async () => {
    const ctx = makeContext();
    findByTelegramId.mockResolvedValue({ id: 'producer-1' });
    parseCarImage.mockResolvedValue({
      ...validCarData(),
      confidence: 0.4,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('fake-image'),
    } as any);

    const result = await service.handleCarPhoto(ctx);

    expect(result).toBe(false);
    expect(draftUpsert).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      Msg.farmRegistration.lowConfidence,
      expect.any(Object),
    );
  });

  it('handleConfirmCarData retorna false quando não há draft', async () => {
    const ctx = makeContext({ message: undefined });
    findByTelegramId.mockResolvedValue({ id: 'producer-1' });
    draftFindUnique.mockResolvedValue(null);

    const result = await service.handleConfirmCarData(ctx);

    expect(result).toBe(false);
    expect(ctx.reply).toHaveBeenCalledWith(Msg.farmRegistration.noPendingDraft);
  });

  it('handleConfirmCarData expira draft antigo e retorna false', async () => {
    const ctx = makeContext({ message: undefined });
    findByTelegramId.mockResolvedValue({ id: 'producer-1' });
    draftFindUnique.mockResolvedValue({
      telegramUserId: '123456',
      expiresAt: new Date(Date.now() - 60_000),
      carData: {},
    });

    const result = await service.handleConfirmCarData(ctx);

    expect(result).toBe(false);
    expect(draftDelete).toHaveBeenCalledWith({
      where: { telegramUserId: '123456' },
    });
    expect(ctx.reply).toHaveBeenCalledWith(Msg.farmRegistration.draftExpired);
  });

  it('handleConfirmCarData cria fazenda/documento, remove draft e dispara EUDR', async () => {
    const ctx = makeContext({ message: undefined });
    findByTelegramId.mockResolvedValue({ id: 'producer-1', name: 'Maria' });
    const data = validCarData();
    draftFindUnique.mockResolvedValue({
      telegramUserId: '123456',
      expiresAt: new Date(Date.now() + 60_000),
      carData: data,
      imageUrl: 'telegram://file/file-best',
      imageFileHash: 'hash-123',
    });
    createFarm.mockResolvedValue({ id: 'farm-1' });
    documentFindUnique.mockResolvedValue(null);
    documentCreate.mockResolvedValue({ id: 'doc-1' });
    draftDelete.mockResolvedValue(undefined);
    validateFarm.mockResolvedValue({ id: 'validation-1' });

    const result = await service.handleConfirmCarData(ctx);

    expect(result).toBe(true);
    expect(createFarm).toHaveBeenCalledWith(
      expect.objectContaining({
        producerId: 'producer-1',
        carNumber: data.carNumber,
      }),
    );
    expect(documentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fileUrl: 'telegram://file/file-best',
      }),
    });
    expect(validateFarm).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      Msg.farmRegistration.createdAndValidating,
    );
  });
});
