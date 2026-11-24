import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

type ErrorBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  requestId: string;
  path: string;
};

describe('HTTP hardening (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.CORS_ORIGINS = 'https://app.agropass.example';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(
      moduleFixture.createNestApplication<NestExpressApplication>(),
    );
    await app.init();
  });

  afterAll(async () => {
    delete process.env.CORS_ORIGINS;
    await app?.close();
  });

  it('aplica os headers de seguranca do helmet', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('gera um id por requisicao e preserva um id valido recebido', async () => {
    const generated = await request(app.getHttpServer()).get('/').expect(200);
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const kept = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', 'trace-123')
      .expect(200);
    expect(kept.headers['x-request-id']).toBe('trace-123');

    const rejected = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', 'bad id with spaces')
      .expect(200);
    expect(rejected.headers['x-request-id']).not.toBe('bad id with spaces');
  });

  it('responde erros num formato unico, com o id da requisicao', async () => {
    const response = await request(app.getHttpServer())
      .get('/rota-inexistente')
      .set('X-Request-Id', 'req-404')
      .expect(404);
    const body = response.body as ErrorBody;

    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      requestId: 'req-404',
      path: '/rota-inexistente',
    });

    const unauthorized = await request(app.getHttpServer())
      .get('/batches')
      .expect(401);
    expect((unauthorized.body as ErrorBody).requestId).toBeDefined();
  });

  it('libera CORS so para as origens configuradas', async () => {
    const allowed = await request(app.getHttpServer())
      .options('/public/batches/AGP-2026-0001')
      .set('Origin', 'https://app.agropass.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'https://app.agropass.example',
    );

    const blocked = await request(app.getHttpServer())
      .options('/public/batches/AGP-2026-0001')
      .set('Origin', 'https://site-malicioso.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('expoe liveness sem depender do banco', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect(({ body }) =>
        expect((body as { status: string }).status).toBe('ok'),
      );
  });

  it('limita tentativas de login por cliente', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ninguem@example.com', password: 'senha-errada-123' });

    const statuses: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      statuses.push((await attempt()).status);
    }

    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
