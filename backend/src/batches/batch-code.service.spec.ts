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
        {
          provide: PrismaService,
          useValue: { batch: { findMany: batchFindMany } },
        },
      ],
    }).compile();

    service = module.get(BatchCodeService);
  });

  it('gera AGP-YYYY-0001 quando nao ha lotes no ano', async () => {
    const year = new Date().getFullYear();
    await expect(service.generate()).resolves.toBe(`AGP-${year}-0001`);
  });

  it('usa o ano da colheita quando informado', async () => {
    await expect(service.generate(new Date('2026-07-15'))).resolves.toBe(
      'AGP-2026-0001',
    );
  });

  it('incrementa a maior sequencia existente', async () => {
    batchFindMany.mockResolvedValue([
      { code: 'AGP-2026-0003' },
      { code: 'AGP-2026-0001' },
      { code: 'AGP-2026-0002' },
    ]);

    await expect(service.generate(new Date('2026-01-01'))).resolves.toBe(
      'AGP-2026-0004',
    );
  });

  it('ignora sufixos que nao sejam numericos', async () => {
    batchFindMany.mockResolvedValue([{ code: 'AGP-2026-INVALIDO' }]);

    await expect(service.generate(new Date('2026-01-01'))).resolves.toBe(
      'AGP-2026-0001',
    );
  });

  it('mantem a sequencia com quatro digitos', async () => {
    batchFindMany.mockResolvedValue([{ code: 'AGP-2026-0009' }]);

    await expect(service.generate(new Date('2026-01-01'))).resolves.toBe(
      'AGP-2026-0010',
    );
  });

  it('consulta somente codigos do ano solicitado', async () => {
    await service.generate(new Date('2026-01-01'));

    expect(batchFindMany).toHaveBeenCalledWith({
      where: { code: { startsWith: 'AGP-2026-' } },
      select: { code: true },
    });
  });
});
