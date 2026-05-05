import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BatchCodeService } from './batch-code.service';

describe('BatchCodeService', () => {
  let service: BatchCodeService;
  let batchFindMany: jest.Mock;

  beforeEach(async () => {
    batchFindMany = jest.fn().mockResolvedValue([]);

    const module = await Test.createTestingModule({
      providers: [
        BatchCodeService,
        { provide: PrismaService, useValue: { batch: { findMany: batchFindMany } } },
      ],
    }).compile();

    service = module.get(BatchCodeService);
  });

  it('gera código 0001 quando não há lotes existentes', async () => {
    const year = new Date().getFullYear();
    const code = await service.generate('COFFEE' as any);
    expect(code).toBe(`CAF-${year}-0001`);
  });

  it('incrementa a sequência a partir do maior código existente', async () => {
    const year = new Date().getFullYear();
    batchFindMany.mockResolvedValue([
      { code: `CAF-${year}-0003` },
      { code: `CAF-${year}-0001` },
      { code: `CAF-${year}-0002` },
    ]);

    const code = await service.generate('COFFEE' as any);
    expect(code).toBe(`CAF-${year}-0004`);
  });

  it('usa o ano do harvestDate quando fornecido', async () => {
    const code = await service.generate('SOY' as any, new Date('2024-07-15'));
    expect(code).toBe('SOJ-2024-0001');
  });

  it('usa o ano corrente quando harvestDate não é fornecido', async () => {
    const year = new Date().getFullYear();
    const code = await service.generate('CATTLE' as any);
    expect(code.startsWith(`GAD-${year}-`)).toBe(true);
  });

  it.each([
    ['COFFEE', 'CAF'],
    ['SOY', 'SOJ'],
    ['CATTLE', 'GAD'],
    ['COCOA', 'CAC'],
    ['PALM_OIL', 'PAL'],
    ['RUBBER', 'BOR'],
    ['WOOD', 'MAD'],
  ])('usa prefixo correto para %s → %s', async (productType, expectedPrefix) => {
    const code = await service.generate(productType as any);
    expect(code.split('-')[0]).toBe(expectedPrefix);
  });

  it('ignora entradas com sequência NaN e começa em 0001', async () => {
    const year = new Date().getFullYear();
    batchFindMany.mockResolvedValue([{ code: `CAF-${year}-INVALIDO` }]);

    const code = await service.generate('COFFEE' as any);
    expect(code).toBe(`CAF-${year}-0001`);
  });

  it('formata a sequência com 4 dígitos (zero-padded)', async () => {
    const year = new Date().getFullYear();
    batchFindMany.mockResolvedValue([{ code: `CAF-${year}-0009` }]);

    const code = await service.generate('COFFEE' as any);
    expect(code).toBe(`CAF-${year}-0010`);
  });

  it('busca apenas códigos com o prefixo correto do produto+ano', async () => {
    const year = new Date().getFullYear();
    await service.generate('COFFEE' as any);

    expect(batchFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: { startsWith: `CAF-${year}-` } },
      }),
    );
  });
});
