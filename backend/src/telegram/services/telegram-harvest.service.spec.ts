import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BatchesService } from '../../batches/batches.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramHarvestService } from './telegram-harvest.service';

type ProductType =
  | 'COFFEE'
  | 'SOY'
  | 'CATTLE'
  | 'COCOA'
  | 'PALM_OIL'
  | 'RUBBER'
  | 'WOOD';

describe('TelegramHarvestService', () => {
  let service: TelegramHarvestService;
  let farmFindFirst: jest.Mock;
  let batchCreate: jest.Mock;

  beforeEach(async () => {
    farmFindFirst = jest.fn();
    batchCreate = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        TelegramHarvestService,
        {
          provide: PrismaService,
          useValue: {
            farm: {
              findFirst: farmFindFirst,
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            batch: { findUnique: jest.fn() },
          },
        },
        {
          provide: BatchesService,
          useValue: { create: batchCreate },
        },
      ],
    }).compile();

    service = module.get(TelegramHarvestService);
  });

  afterEach(() => {
    delete process.env.PUBLIC_BATCHES_URL;
    delete process.env.PUBLIC_BACKEND_URL;
    delete process.env.PUBLIC_APP_URL;
    jest.restoreAllMocks();
  });

  // â”€â”€â”€ getFarmIfOwned â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('getFarmIfOwned', () => {
    it('retorna null quando a fazenda pertence a outro produtor', async () => {
      farmFindFirst.mockResolvedValue(null);

      const result = await service.getFarmIfOwned('farm-1', 'wrong-producer');

      expect(result).toBeNull();
      expect(farmFindFirst).toHaveBeenCalledWith({
        where: { id: 'farm-1', producerId: 'wrong-producer' },
        select: {
          id: true,
          name: true,
          lastValidationStatus: true,
          lastValidationHash: true,
        },
      });
    });

    it('retorna { id, name } quando a fazenda pertence ao produtor', async () => {
      const farm = {
        id: 'farm-1',
        name: 'Fazenda Santa Fé',
        lastValidationStatus: 'COMPLIANT',
        lastValidationHash: 'hash',
      };
      farmFindFirst.mockResolvedValue(farm);

      const result = await service.getFarmIfOwned('farm-1', 'producer-1');

      expect(result).toEqual(farm);
    });
  });

  // â”€â”€â”€ buildPublicBatchUrl â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('buildPublicBatchUrl', () => {
    it('usa PUBLIC_BATCHES_URL quando configurada', () => {
      process.env.PUBLIC_BATCHES_URL = 'https://api.agropass.com';

      expect(service.buildPublicBatchUrl('CAF-2026-0001')).toBe(
        'https://api.agropass.com/public/batches/CAF-2026-0001',
      );
    });

    it('usa PUBLIC_BACKEND_URL como segunda opÃ§Ã£o', () => {
      process.env.PUBLIC_BACKEND_URL = 'https://backend.agropass.com';

      expect(service.buildPublicBatchUrl('SOJ-2026-0001')).toBe(
        'https://backend.agropass.com/public/batches/SOJ-2026-0001',
      );
    });

    it('usa PUBLIC_APP_URL como terceira opÃ§Ã£o', () => {
      process.env.PUBLIC_APP_URL = 'https://app.agropass.com';

      expect(service.buildPublicBatchUrl('GAD-2026-0001')).toBe(
        'https://app.agropass.com/public/batches/GAD-2026-0001',
      );
    });

    it('usa localhost e emite warn quando nenhuma env var estÃ¡ configurada', () => {
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => {});

      const url = service.buildPublicBatchUrl('CAF-2026-0001');

      expect(url).toMatch(
        /^http:\/\/localhost:\d+\/public\/batches\/CAF-2026-0001$/,
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('remove barra final da URL base', () => {
      process.env.PUBLIC_BATCHES_URL = 'https://api.agropass.com/';

      expect(service.buildPublicBatchUrl('CAF-2026-0001')).toBe(
        'https://api.agropass.com/public/batches/CAF-2026-0001',
      );
    });
  });

  // â”€â”€â”€ getUnit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('getUnit', () => {
    const cases: Array<[ProductType, string]> = [
      ['COFFEE', 'sacas'],
      ['SOY', 'sacas'],
      ['CATTLE', 'cabeças'],
      ['COCOA', 'sacas'],
      ['PALM_OIL', 'toneladas'],
      ['RUBBER', 'kg'],
      ['WOOD', 'm³'],
    ];

    it.each(cases)(
      'retorna unidade correta para %s',
      (productType, expectedUnit) => {
        expect(service.getUnit(productType)).toBe(expectedUnit);
      },
    );
  });
});
