import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FarmsService } from './farms.service';

const ADMIN_USER = {
  sub: 'admin-uuid',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  producerId: null,
  cooperativeId: null,
} as const;

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
    producerId: 'producer-uuid',
    producer: {
      id: 'producer-uuid',
      name: 'Produtor Teste',
      cooperative: null,
    },
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
  let $transaction: jest.Mock;

  beforeEach(async () => {
    farmCreate = jest.fn();
    farmFindUnique = jest.fn();
    $transaction = jest
      .fn()
      .mockImplementation((operations: unknown[]) => Promise.all(operations));

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
              count: jest.fn().mockResolvedValue(0),
            },
            $transaction,
          },
        },
      ],
    }).compile();

    service = module.get(FarmsService);
  });

  describe('create', () => {
    it('cria fazenda no caminho feliz', async () => {
      farmCreate.mockResolvedValue(makeFarm());

      const result = await service.create(BASE_CREATE_DTO, ADMIN_USER);

      expect(result.id).toBe('farm-uuid');
      expect(result.name).toBe('Fazenda Test');
    });

    it('normaliza estado, nome e cidade', async () => {
      farmCreate.mockResolvedValue(makeFarm());

      await service.create(
        {
          ...BASE_CREATE_DTO,
          name: '  Fazenda Test  ',
          city: '  Rio Verde  ',
          state: 'go',
        },
        ADMIN_USER,
      );

      expect(farmCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Fazenda Test',
            city: 'Rio Verde',
            state: 'GO',
          }),
        }),
      );
    });

    it('transforma CAR vazio em null', async () => {
      farmCreate.mockResolvedValue(makeFarm());

      await service.create({ ...BASE_CREATE_DTO, carNumber: '' }, ADMIN_USER);

      expect(farmCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ carNumber: null }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('retorna lista paginada', async () => {
      $transaction.mockResolvedValue([
        [makeFarm(), makeFarm({ id: 'farm-2' })],
        2,
      ]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(2);
    });

    it('calcula totalPages e mantém no mínimo uma página', async () => {
      $transaction.mockResolvedValue([[makeFarm()], 25]);
      await expect(service.findAll(1, 10)).resolves.toMatchObject({
        pagination: { totalPages: 3 },
      });

      $transaction.mockResolvedValue([[], 0]);
      await expect(service.findAll(1, 10)).resolves.toMatchObject({
        pagination: { totalPages: 1 },
      });
    });
  });

  describe('findOne', () => {
    it('retorna fazenda com produtor', async () => {
      farmFindUnique.mockResolvedValue(makeFarm());

      const result = await service.findOne('farm-uuid');

      expect(result.id).toBe('farm-uuid');
      expect(result.producerName).toBe('Produtor Teste');
    });

    it('lança NotFoundException quando não existe', async () => {
      farmFindUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
