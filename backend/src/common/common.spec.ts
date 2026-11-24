import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import type { NextFunction, Request, Response } from 'express';
import { allowedOrigins, createLogger } from '../app.setup';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { detectMimeType } from './file-signature';
import { RequestContextMiddleware } from './request-context.middleware';

describe('detectMimeType', () => {
  it('reconhece PDF, PNG e JPEG pelos bytes iniciais', () => {
    expect(detectMimeType(Buffer.from('%PDF-1.7\n...'))).toBe(
      'application/pdf',
    );
    expect(
      detectMimeType(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
      ),
    ).toBe('image/png');
    expect(detectMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe(
      'image/jpeg',
    );
  });

  it('rejeita conteudo antes do cabecalho do PDF', () => {
    expect(
      detectMimeType(
        Buffer.concat([Buffer.alloc(100, 0x20), Buffer.from('%PDF-1.4')]),
      ),
    ).toBeNull();
  });

  it('nao reconhece arquivos disfarcados', () => {
    expect(detectMimeType(Buffer.from('MZ\x90\x00 executavel'))).toBeNull();
    expect(detectMimeType(Buffer.from('<html>nota.pdf</html>'))).toBeNull();
    expect(detectMimeType(Buffer.alloc(0))).toBeNull();
  });
});

function httpHost(response: Partial<Response>, url = '/batches/x?debug=1') {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', originalUrl: url }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
}

function fakeResponse() {
  const response = {
    locals: { requestId: 'req-1' },
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  let logError: jest.SpyInstance;

  beforeEach(() => {
    logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('mantem status e mensagem das excecoes HTTP, com request id e path', () => {
    const response = fakeResponse();
    filter.catch(
      new NotFoundException('Lote nao encontrado.'),
      httpHost(response as never),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        message: 'Lote nao encontrado.',
        requestId: 'req-1',
        path: '/batches/x',
      }),
    );
  });

  it('preserva a lista de erros de validacao', () => {
    const response = fakeResponse();
    filter.catch(
      new BadRequestException(['quantity must be positive']),
      httpHost(response as never),
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['quantity must be positive'],
      }),
    );
  });

  it('traduz erros conhecidos do Prisma', () => {
    class PrismaClientKnownRequestError extends Error {
      code = 'P2002';
    }
    const response = fakeResponse();
    filter.catch(
      new PrismaClientKnownRequestError('Unique constraint'),
      httpHost(response as never),
    );

    expect(response.status).toHaveBeenCalledWith(409);
  });

  it('esconde detalhes de erros inesperados inclusive dos logs', () => {
    const response = fakeResponse();
    filter.catch(
      new Error('connection string postgres://user:senha@db'),
      httpHost(response as never),
    );

    expect(response.status).toHaveBeenCalledWith(500);
    const body = (response.json.mock.calls[0] as [{ message: string }])[0];
    expect(body.message).toBe('Erro interno do servidor.');
    expect(JSON.stringify(body)).not.toContain('senha');
    expect(logError).toHaveBeenCalled();
    expect(JSON.stringify(logError.mock.calls)).not.toContain('senha');
  });
});

describe('RequestContextMiddleware', () => {
  const middleware = new RequestContextMiddleware();

  function run(headers: Record<string, string> = {}) {
    const locals: { requestId?: string } = {};
    const response = Object.assign(new EventEmitter(), {
      locals,
      statusCode: 200,
      setHeader: jest.fn(),
    });
    const request = {
      method: 'GET',
      originalUrl: '/batches',
      header: (name: string) => headers[name.toLowerCase()],
    };
    const next: NextFunction = jest.fn();
    middleware.use(
      request as unknown as Request,
      response as unknown as Response,
      next,
    );
    return { response, next };
  }

  it('gera um id, devolve no header e segue a requisicao', () => {
    const { response, next } = run();

    expect(response.locals.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      response.locals.requestId,
    );
    expect(next).toHaveBeenCalled();
  });

  it('registra uma linha estruturada ao terminar a resposta', () => {
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const { response } = run({ 'x-request-id': 'abc-123' });

    response.emit('finish');

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'abc-123',
        method: 'GET',
        path: '/batches',
        statusCode: 200,
        durationMs: expect.any(Number) as number,
      }),
    );
    log.mockRestore();
  });
});

describe('configuracao de producao', () => {
  it('le as origens de CORS do ambiente e so confia em localhost fora de producao', () => {
    const env = {
      PUBLIC_APP_URL: 'https://app.agropass.com.br/agro-pass/',
      CORS_ORIGINS: 'https://admin.agropass.com.br, ',
    };

    expect(allowedOrigins({ ...env, NODE_ENV: 'production' })).toEqual([
      'https://app.agropass.com.br',
      'https://admin.agropass.com.br',
    ]);
    expect(allowedOrigins({ ...env, NODE_ENV: 'development' })).toContain(
      'http://localhost:5173',
    );
  });

  it('usa logs JSON em producao ou com LOG_FORMAT=json', () => {
    const optionsOf = (logger: ReturnType<typeof createLogger>) =>
      (logger as unknown as { options: { json?: boolean } }).options;

    expect(optionsOf(createLogger({ NODE_ENV: 'production' })).json).toBe(true);
    expect(optionsOf(createLogger({ LOG_FORMAT: 'json' })).json).toBe(true);
    expect(optionsOf(createLogger({ NODE_ENV: 'development' })).json).toBe(
      false,
    );
  });
});
