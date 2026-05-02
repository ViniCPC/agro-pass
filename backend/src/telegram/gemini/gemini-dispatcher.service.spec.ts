import { Test } from '@nestjs/testing';
import { GeminiDispatcherService, DispatchContext } from './gemini-dispatcher.service';
import { TelegramHarvestService } from '../services/telegram-harvest.service';

const CONTEXT: DispatchContext = { telegramUserId: 'tg-123', producerId: 'producer-1' };

function makeFarm(overrides: Record<string, unknown> = {}) {
  return { id: 'farm-1', name: 'Fazenda Aurora', city: 'Patrocínio', state: 'MG', ...overrides };
}

describe('GeminiDispatcherService', () => {
  let service: GeminiDispatcherService;
  let getFarmsForProducer: jest.Mock;
  let getFarmIfOwned: jest.Mock;
  let createBatch: jest.Mock;

  beforeEach(async () => {
    getFarmsForProducer = jest.fn();
    getFarmIfOwned = jest.fn();
    createBatch = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        GeminiDispatcherService,
        {
          provide: TelegramHarvestService,
          useValue: { getFarmsForProducer, getFarmIfOwned, createBatch },
        },
      ],
    }).compile();

    service = module.get(GeminiDispatcherService);
  });

  // ─── listar_fazendas ────────────────────────────────────────────────

  describe('listar_fazendas', () => {
    it('retorna lista de fazendas do produtor como JSON', async () => {
      getFarmsForProducer.mockResolvedValue([makeFarm()]);

      const result = await service.dispatch('listar_fazendas', {}, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.farms).toHaveLength(1);
      expect(parsed.farms[0]).toMatchObject({ id: 'farm-1', name: 'Fazenda Aurora', city: 'Patrocínio', state: 'MG' });
      expect(getFarmsForProducer).toHaveBeenCalledWith('producer-1');
    });

    it('retorna lista vazia quando produtor não tem fazendas', async () => {
      getFarmsForProducer.mockResolvedValue([]);

      const result = await service.dispatch('listar_fazendas', {}, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.farms).toHaveLength(0);
    });
  });

  // ─── criar_lote ─────────────────────────────────────────────────────

  describe('criar_lote', () => {
    const VALID_ARGS = { farmId: 'farm-1', productType: 'COFFEE', quantity: 100 };

    it('cria lote e retorna código como JSON no caminho feliz', async () => {
      getFarmIfOwned.mockResolvedValue({ id: 'farm-1', name: 'Fazenda Aurora' });
      createBatch.mockResolvedValue({ code: 'CAF-2026-0001', quantity: 100 });

      const result = await service.dispatch('criar_lote', VALID_ARGS, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.batchCode).toBe('CAF-2026-0001');
      expect(createBatch).toHaveBeenCalledWith({
        productType: 'COFFEE',
        farmId: 'farm-1',
        quantity: 100,
      });
    });

    it('retorna erro quando farmId está ausente', async () => {
      const result = await service.dispatch('criar_lote', { productType: 'COFFEE', quantity: 100 }, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(createBatch).not.toHaveBeenCalled();
    });

    it('retorna erro quando productType é inválido', async () => {
      const result = await service.dispatch('criar_lote', { ...VALID_ARGS, productType: 'BANANA' }, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(createBatch).not.toHaveBeenCalled();
    });

    it('retorna erro quando quantity não é inteiro positivo', async () => {
      const result = await service.dispatch('criar_lote', { ...VALID_ARGS, quantity: -5 }, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(createBatch).not.toHaveBeenCalled();
    });

    it('retorna erro quando fazenda não pertence ao produtor', async () => {
      getFarmIfOwned.mockResolvedValue(null);

      const result = await service.dispatch('criar_lote', VALID_ARGS, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(createBatch).not.toHaveBeenCalled();
    });

    it('arredonda quantity decimal para inteiro mais próximo', async () => {
      getFarmIfOwned.mockResolvedValue({ id: 'farm-1', name: 'Fazenda Aurora' });
      createBatch.mockResolvedValue({ code: 'CAF-2026-0001', quantity: 100 });

      await service.dispatch('criar_lote', { ...VALID_ARGS, quantity: 100.7 }, CONTEXT);

      expect(createBatch).toHaveBeenCalledWith(expect.objectContaining({ quantity: 101 }));
    });
  });

  // ─── função desconhecida ─────────────────────────────────────────────

  describe('função desconhecida', () => {
    it('retorna erro JSON para função não mapeada', async () => {
      const result = await service.dispatch('funcao_inexistente', {}, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
    });
  });

  // ─── erro de serviço ────────────────────────────────────────────────

  describe('erro de serviço', () => {
    it('captura exceção e retorna JSON de erro genérico', async () => {
      getFarmsForProducer.mockRejectedValue(new Error('DB offline'));

      const result = await service.dispatch('listar_fazendas', {}, CONTEXT);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
    });
  });
});
