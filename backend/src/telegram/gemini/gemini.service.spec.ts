import { Test } from '@nestjs/testing';
import { GeminiService } from './gemini.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiDispatcherService } from './gemini-dispatcher.service';

const TELEGRAM_ID = 'tg-123';
const PRODUCER_ID = 'producer-1';

function makeDbMessage(role: 'USER' | 'MODEL', content: string) {
  return { id: 'msg-1', telegramUserId: TELEGRAM_ID, role, content, createdAt: new Date() };
}

function makeGeminiResponse(text: string, calls: unknown[] | null = null) {
  return {
    response: {
      text: () => text,
      functionCalls: () => calls,
    },
  };
}

describe('GeminiService', () => {
  let service: GeminiService;
  let findMany: jest.Mock;
  let createMessage: jest.Mock;
  let mockSendMessage: jest.Mock;
  let mockDispatch: jest.Mock;
  let mockStartChat: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([]);
    createMessage = jest.fn().mockResolvedValue({});
    mockSendMessage = jest.fn();
    mockDispatch = jest.fn();
    mockStartChat = jest.fn().mockReturnValue({ sendMessage: mockSendMessage });

    const mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue({ startChat: mockStartChat }),
    };

    const module = await Test.createTestingModule({
      providers: [
        GeminiService,
        { provide: 'GEMINI_AI', useValue: mockGenAI },
        {
          provide: PrismaService,
          useValue: {
            conversationMessage: { findMany, create: createMessage },
          },
        },
        {
          provide: GeminiDispatcherService,
          useValue: { dispatch: mockDispatch },
        },
      ],
    }).compile();

    service = module.get(GeminiService);
  });

  // ─── caminho feliz — resposta de texto ──────────────────────────────

  describe('chat — resposta de texto', () => {
    it('retorna o texto da resposta do Gemini', async () => {
      mockSendMessage.mockResolvedValue(makeGeminiResponse('Olá! Como posso ajudar?'));

      const result = await service.chat(TELEGRAM_ID, PRODUCER_ID, 'Olá');

      expect(result).toBe('Olá! Como posso ajudar?');
    });

    it('salva mensagem do usuário (USER) antes de enviar ao Gemini', async () => {
      mockSendMessage.mockResolvedValue(makeGeminiResponse('ok'));

      await service.chat(TELEGRAM_ID, PRODUCER_ID, 'pergunta do usuário');

      expect(createMessage).toHaveBeenNthCalledWith(1, {
        data: { telegramUserId: TELEGRAM_ID, role: 'USER', content: 'pergunta do usuário' },
      });
    });

    it('salva resposta final do modelo (MODEL) após receber a resposta', async () => {
      mockSendMessage.mockResolvedValue(makeGeminiResponse('resposta do bot'));

      await service.chat(TELEGRAM_ID, PRODUCER_ID, 'pergunta');

      expect(createMessage).toHaveBeenNthCalledWith(2, {
        data: { telegramUserId: TELEGRAM_ID, role: 'MODEL', content: 'resposta do bot' },
      });
    });
  });

  // ─── histórico ──────────────────────────────────────────────────────

  describe('chat — histórico de conversa', () => {
    it('carrega histórico do banco com limite de 20 mensagens', async () => {
      mockSendMessage.mockResolvedValue(makeGeminiResponse('ok'));

      await service.chat(TELEGRAM_ID, PRODUCER_ID, 'olá');

      expect(findMany).toHaveBeenCalledWith({
        where: { telegramUserId: TELEGRAM_ID },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
    });

    it('converte mensagens do banco para formato Content do Gemini', async () => {
      findMany.mockResolvedValue([
        makeDbMessage('USER', 'oi'),
        makeDbMessage('MODEL', 'olá!'),
      ]);
      mockSendMessage.mockResolvedValue(makeGeminiResponse('ok'));

      await service.chat(TELEGRAM_ID, PRODUCER_ID, 'nova mensagem');

      expect(mockStartChat).toHaveBeenCalledWith({
        history: [
          { role: 'user', parts: [{ text: 'oi' }] },
          { role: 'model', parts: [{ text: 'olá!' }] },
        ],
      });
    });

    it('passa histórico vazio quando usuário não tem mensagens anteriores', async () => {
      findMany.mockResolvedValue([]);
      mockSendMessage.mockResolvedValue(makeGeminiResponse('ok'));

      await service.chat(TELEGRAM_ID, PRODUCER_ID, 'primeira mensagem');

      expect(mockStartChat).toHaveBeenCalledWith({ history: [] });
    });
  });

  // ─── tool call ──────────────────────────────────────────────────────

  describe('chat — tool call', () => {
    it('executa tool call e retorna resposta final após enviar resultado', async () => {
      mockSendMessage
        .mockResolvedValueOnce(
          makeGeminiResponse('', [{ name: 'listar_fazendas', args: {} }]),
        )
        .mockResolvedValueOnce(makeGeminiResponse('Você tem 1 fazenda: Fazenda Aurora.'));

      mockDispatch.mockResolvedValue('{"farms":[{"id":"f-1","name":"Fazenda Aurora"}]}');

      const result = await service.chat(TELEGRAM_ID, PRODUCER_ID, 'quais minhas fazendas?');

      expect(mockDispatch).toHaveBeenCalledWith(
        'listar_fazendas',
        {},
        { telegramUserId: TELEGRAM_ID, producerId: PRODUCER_ID },
      );
      expect(result).toBe('Você tem 1 fazenda: Fazenda Aurora.');
    });

    it('encadeia múltiplos tool calls até chegar na resposta de texto', async () => {
      mockSendMessage
        .mockResolvedValueOnce(
          makeGeminiResponse('', [{ name: 'listar_fazendas', args: {} }]),
        )
        .mockResolvedValueOnce(
          makeGeminiResponse('', [{ name: 'criar_lote', args: { farmId: 'f-1', productType: 'COFFEE', quantity: 100 } }]),
        )
        .mockResolvedValueOnce(makeGeminiResponse('Lote CAF-2026-0001 criado com sucesso!'));

      mockDispatch
        .mockResolvedValueOnce('{"farms":[{"id":"f-1","name":"Fazenda Aurora"}]}')
        .mockResolvedValueOnce('{"success":true,"batchCode":"CAF-2026-0001","quantity":100}');

      const result = await service.chat(TELEGRAM_ID, PRODUCER_ID, 'criar lote de café na Fazenda Aurora');

      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(result).toBe('Lote CAF-2026-0001 criado com sucesso!');
    });

    it('persiste apenas a resposta final de texto, não as mensagens intermediárias de tool call', async () => {
      mockSendMessage
        .mockResolvedValueOnce(makeGeminiResponse('', [{ name: 'listar_fazendas', args: {} }]))
        .mockResolvedValueOnce(makeGeminiResponse('Suas fazendas são: Fazenda Aurora.'));

      mockDispatch.mockResolvedValue('{"farms":[]}');

      await service.chat(TELEGRAM_ID, PRODUCER_ID, 'minhas fazendas');

      // 1 chamada para USER + 1 para MODEL (texto final) = 2 total
      expect(createMessage).toHaveBeenCalledTimes(2);
      expect(createMessage).toHaveBeenLastCalledWith({
        data: { telegramUserId: TELEGRAM_ID, role: 'MODEL', content: 'Suas fazendas são: Fazenda Aurora.' },
      });
    });
  });
});
