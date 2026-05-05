import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FarmStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { FarmsService } from './farms.service';

function makeFarm(overrides: Record<string, unknown> = {}) {
  return {
    id: 'farm-uuid',
    name: 'Fazenda Test',
    city: 'Rio Verde',
    state: 'GO',
    latitude: -17.79,
    longitude: -50.93,
    carNumber: null,
    polygonGeoJson: null,
    totalAreaHa: null,
    legalReserveAreaHa: null,
    appAreaHa: null,
    consolidatedAreaHa: null,
    biome: null,
    isAmazonLegal: false,
    status: FarmStatus.PENDING,
    lastValidationId: null,
    producerId: 'producer-uuid',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const BASE_CREATE_DTO = {
  name: 'Fazenda Test',
  city: 'Rio Verde',
  state: 'GO',
  latitude: -17.79,
  longitude: -50.93,
  producerId: 'producer-uuid',
};

describe('FarmsService', () => {
  let service: FarmsService;
  let farmCreate: jest.Mock;
  let farmFindUnique: jest.Mock;
  let farmUpdate: jest.Mock;
  let $transaction: jest.Mock;

  beforeEach(async () => {
    farmCreate = jest.fn();
    farmFindUnique = jest.fn();
    farmUpdate = jest.fn();
    $transaction = jest.fn().mockImplementation((arr: unknown[]) => Promise.all(arr));

    const module = await Test.createTestingModule({
      providers: [
        FarmsService,
        {
          provide: PrismaService,
          useValue: {
            farm: {
              create: farmCreate,
              findUnique: farmFindUnique,
              findMany: jest.fn().mockResolvedValue([]),
              update: farmUpdate,
              count: jest.fn().mockResolvedValue(0),
            },
            $transaction,
          },
        },
      ],
    }).compile();

    service = module.get(FarmsService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('cria fazenda no caminho feliz', async () => {
      farmCreate.mockResolvedValue(makeFarm());

      const result = await service.create(BASE_CREATE_DTO);

      expect(result.id).toBe('farm-uuid');
      expect(result.name).toBe('Fazenda Test');
    });

    it('normaliza state para uppercase', async () => {
      farmCreate.mockResolvedValue(makeFarm({ state: 'GO' }));

      await service.create({ ...BASE_CREATE_DTO, state: 'go' });

      expect(farmCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ state: 'GO' }) }),
      );
    });

    it('trimeia name e city', async () => {
      farmCreate.mockResolvedValue(makeFarm());

      await service.create({ ...BASE_CREATE_DTO, name: '  Fazenda Test  ', city: '  Rio Verde  ' });

      expect(farmCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Fazenda Test', city: 'Rio Verde' }),
        }),
      );
    });

    it('define isAmazonLegal como false por padrão quando não fornecido', async () => {
      farmCreate.mockResolvedValue(makeFarm());

      await service.create(BASE_CREATE_DTO);

      expect(farmCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isAmazonLegal: false }) }),
      );
    });

    it('transforma carNumber vazio em null', async () => {
      farmCreate.mockResolvedValue(makeFarm());

      await service.create({ ...BASE_CREATE_DTO, carNumber: '' });

      expect(farmCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ carNumber: null }) }),
      );
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retorna lista paginada com dados corretos', async () => {
      $transaction.mockResolvedValue([[makeFarm(), makeFarm({ id: 'f-2' })], 2]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('calcula totalPages corretamente', async () => {
      $transaction.mockResolvedValue([[makeFarm()], 25]);

      const result = await service.findAll(1, 10);

      expect(result.pagination.totalPages).toBe(3);
    });

    it('retorna totalPages mínimo 1 quando não há registros', async () => {
      $transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll(1, 10);

      expect(result.pagination.totalPages).toBe(1);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retorna fazenda existente', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());

      const result = await service.findOne('farm-uuid');

      expect(result.id).toBe('farm-uuid');
    });

    it('lança NotFoundException quando fazenda não existe', async () => {
      farmFindUnique.mockResolvedValue(null);

      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('atualiza status da fazenda', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      farmUpdate.mockResolvedValue(makeFarm({ status: FarmStatus.APPROVED }));

      const result = await service.updateStatus('farm-uuid', { status: FarmStatus.APPROVED });

      expect(result.status).toBe(FarmStatus.APPROVED);
    });

    it('lança NotFoundException quando fazenda não existe', async () => {
      farmFindUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('x', { status: FarmStatus.APPROVED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('chama update com o status correto', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());
      farmUpdate.mockResolvedValue(makeFarm({ status: FarmStatus.REJECTED }));

      await service.updateStatus('farm-uuid', { status: FarmStatus.REJECTED });

      expect(farmUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: FarmStatus.REJECTED } }),
      );
    });
  });
});
