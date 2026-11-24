import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Pedidos de demonstracao (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `${Date.now()}@pedido-demo.example`;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(
      moduleFixture.createNestApplication<NestExpressApplication>(),
    );
    await app.init();
    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await prisma?.demoRequest.deleteMany({
      where: { email: { endsWith: suffix } },
    });
    await app?.close();
  });

  const body = (overrides: Record<string, unknown> = {}) => ({
    name: 'Maria Souza',
    company: 'Fazenda Boa Esperança',
    email: `maria-${suffix}`,
    phone: '(34) 99999-0000',
    profile: 'PRODUCER',
    consent: true,
    ...overrides,
  });

  it('recebe o pedido sem login e o grava com o consentimento', async () => {
    const { body: created } = await request(app.getHttpServer())
      .post('/public/demo-requests')
      .send(body())
      .expect(201);

    expect(created).toEqual({
      id: expect.any(String),
      receivedAt: expect.any(String),
    });
    const stored = await prisma.demoRequest.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(stored).toMatchObject({
      email: `maria-${suffix}`,
      profile: 'PRODUCER',
    });
    expect(stored.consentAt).toBeInstanceOf(Date);
  });

  it('recusa pedido sem consentimento ou preenchido por bot', async () => {
    await request(app.getHttpServer())
      .post('/public/demo-requests')
      .send(body({ consent: false }))
      .expect(400);
    await request(app.getHttpServer())
      .post('/public/demo-requests')
      .send(body({ website: 'http://spam.example' }))
      .expect(400);
  });

  it('so administradores listam os pedidos', async () => {
    await request(app.getHttpServer()).get('/demo-requests').expect(401);
  });

  it('limita envios repetidos do mesmo cliente', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const response = await request(app.getHttpServer())
        .post('/public/demo-requests')
        .send(body({ email: `extra-${i}-${suffix}` }));
      statuses.push(response.status);
    }
    expect(statuses).toContain(429);
  });
});
