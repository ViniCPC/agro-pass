import { Test } from '@nestjs/testing';
import { TelegramAccountService } from './telegram-account.service';
import { PrismaService } from '../../prisma/prisma.service';

const TELEGRAM_ID = 'tg-123456';
const PHONE_RAW = '31999990001';

function makePrismaProducer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'producer-1',
    name: 'João da Silva',
    phone: PHONE_RAW,
    telegramUserId: null,
    document: null,
    walletAddress: null,
    reputationScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('TelegramAccountService', () => {
  let service: TelegramAccountService;
  let findMany: jest.Mock;
  let findUnique: jest.Mock;
  let update: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn();
    findUnique = jest.fn();
    update = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        TelegramAccountService,
        {
          provide: PrismaService,
          useValue: { producer: { findMany, findUnique, update } },
        },
      ],
    }).compile();

    service = module.get(TelegramAccountService);
  });

  // ─── linkAccount ─────────────────────────────────────────────────────

  describe('linkAccount', () => {
    it('retorna not_found quando nenhum produtor tem o telefone', async () => {
      findMany.mockResolvedValue([]);

      const result = await service.linkAccount(TELEGRAM_ID, PHONE_RAW);

      expect(result.status).toBe('not_found');
      expect(findMany).toHaveBeenCalledWith({ where: { phone: PHONE_RAW } });
    });

    it('retorna ambiguous quando múltiplos produtores têm o mesmo telefone', async () => {
      findMany.mockResolvedValue([
        makePrismaProducer({ id: 'p-1' }),
        makePrismaProducer({ id: 'p-2', name: 'Maria' }),
      ]);

      const result = await service.linkAccount(TELEGRAM_ID, PHONE_RAW);

      expect(result.status).toBe('ambiguous');
    });

    it('retorna already_linked quando produtor já está vinculado a este Telegram', async () => {
      findMany.mockResolvedValue([
        makePrismaProducer({ telegramUserId: TELEGRAM_ID }),
      ]);

      const result = await service.linkAccount(TELEGRAM_ID, PHONE_RAW);

      expect(result).toEqual({ status: 'already_linked', producerName: 'João da Silva' });
      expect(update).not.toHaveBeenCalled();
    });

    it('retorna phone_conflict quando telefone já está vinculado a outro Telegram', async () => {
      findMany.mockResolvedValue([
        makePrismaProducer({ telegramUserId: 'outro-tg-id' }),
      ]);

      const result = await service.linkAccount(TELEGRAM_ID, PHONE_RAW);

      expect(result.status).toBe('phone_conflict');
      expect(update).not.toHaveBeenCalled();
    });

    it('retorna telegram_conflict quando este Telegram já pertence a outro produtor', async () => {
      findMany.mockResolvedValue([makePrismaProducer()]);
      findUnique.mockResolvedValue(
        makePrismaProducer({ id: 'p-2', name: 'Maria', telegramUserId: TELEGRAM_ID }),
      );

      const result = await service.linkAccount(TELEGRAM_ID, PHONE_RAW);

      expect(result).toEqual({ status: 'telegram_conflict', existingProducerName: 'Maria' });
      expect(update).not.toHaveBeenCalled();
    });

    it('vincula e retorna success no caminho feliz', async () => {
      findMany.mockResolvedValue([makePrismaProducer()]);
      findUnique.mockResolvedValue(null);
      update.mockResolvedValue(makePrismaProducer({ telegramUserId: TELEGRAM_ID }));

      const result = await service.linkAccount(TELEGRAM_ID, PHONE_RAW);

      expect(result).toEqual({ status: 'success', producerName: 'João da Silva' });
      expect(update).toHaveBeenCalledWith({
        where: { id: 'producer-1' },
        data: { telegramUserId: TELEGRAM_ID },
      });
    });
  });

  // ─── normalizePhone ──────────────────────────────────────────────────

  describe('normalizePhone', () => {
    it.each([
      ['(31) 9 9999-0001', '31999990001'],
      ['31.99990001', '3199990001'],
      ['+55 31 9999-0001', '553199990001'],
      ['31999990001', '31999990001'],
    ])('normaliza "%s" para "%s"', (input, expected) => {
      expect(service.normalizePhone(input)).toBe(expected);
    });
  });

  // ─── isValidPhoneLength ──────────────────────────────────────────────

  describe('isValidPhoneLength', () => {
    it('aceita 10 dígitos (fixo com DDD)', () => {
      expect(service.isValidPhoneLength('3133330001')).toBe(true);
    });

    it('aceita 11 dígitos (celular com 9)', () => {
      expect(service.isValidPhoneLength('31999990001')).toBe(true);
    });

    it('rejeita 9 dígitos (sem DDD)', () => {
      expect(service.isValidPhoneLength('999990001')).toBe(false);
    });

    it('rejeita 12 dígitos (DDI incluso)', () => {
      expect(service.isValidPhoneLength('553199990001')).toBe(false);
    });
  });
});
