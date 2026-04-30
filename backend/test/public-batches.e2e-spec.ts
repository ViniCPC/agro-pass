import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.TELEGRAM_ENABLED = 'false';

describe('PublicBatches (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let producerId: string;
  let farmId: string;
  let batchId: string;
  let batchCode: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // Criar produtor
    const producerRes = await request(app.getHttpServer())
      .post('/producers')
      .send({ name: 'João E2E', phone: '31999990001' })
      .expect(201);
    producerId = producerRes.body.id;

    // Criar fazenda
    const farmRes = await request(app.getHttpServer())
      .post('/farms')
      .send({
        name: 'Fazenda E2E',
        city: 'Rio Verde',
        state: 'GO',
        latitude: -17.79,
        longitude: -50.93,
        producerId,
      })
      .expect(201);
    farmId = farmRes.body.id;

    // Criar lote
    const batchRes = await request(app.getHttpServer())
      .post('/batches')
      .send({ farmId, productType: 'COFFEE', quantity: 50, unit: 'sacas' })
      .expect(201);
    batchId = batchRes.body.id;
    batchCode = batchRes.body.code;
  });

  afterAll(async () => {
    if (prisma && batchId) {
      await prisma.traceEvent.deleteMany({ where: { batchId } });
      await prisma.batch.delete({ where: { id: batchId } });
    }

    if (prisma && farmId) {
      await prisma.farm.delete({ where: { id: farmId } });
    }

    if (prisma && producerId) {
      await prisma.producer.delete({ where: { id: producerId } });
    }

    await app?.close();
  });

  // ─── GET /public/batches/:code ────────────────────────────────────────

  it('404 para código inexistente', () => {
    return request(app.getHttpServer())
      .get('/public/batches/NOTEXIST')
      .expect(404);
  });

  it('200 com estrutura batch / blockchain / farm / traceEvents', async () => {
    const { body } = await request(app.getHttpServer())
      .get(`/public/batches/${batchCode}`)
      .expect(200);

    expect(body.batch).toMatchObject({
      id: batchId,
      code: batchCode,
      productType: 'COFFEE',
      quantity: 50,
      unit: 'sacas',
      status: 'CREATED',
    });

    expect(body.blockchain).toMatchObject({
      cnftAddress: null,
      merkleTree: null,
      metadataUri: null,
      mintTxHash: null,
    });

    expect(body.farm).toMatchObject({
      id: farmId,
      name: 'Fazenda E2E',
      city: 'Rio Verde',
      state: 'GO',
      producer: { name: 'João E2E' },
    });

    expect(Array.isArray(body.traceEvents)).toBe(true);
    expect(body.traceEvents).toHaveLength(0);
  });

  it('traceEvents aparecem em ordem cronológica (ASC)', async () => {
    // Adicionar dois eventos sequencialmente
    await request(app.getHttpServer())
      .post(`/batches/${batchId}/events`)
      .send({ type: 'CREATED', actorName: 'Produtor E2E' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/batches/${batchId}/events`)
      .send({ type: 'HARVESTED', actorName: 'Cooperativa E2E' })
      .expect(201);

    const { body } = await request(app.getHttpServer())
      .get(`/public/batches/${batchCode}`)
      .expect(200);

    expect(body.traceEvents).toHaveLength(2);
    const [first, second] = body.traceEvents as Array<{ createdAt: string; type: string }>;
    expect(new Date(first.createdAt).getTime()).toBeLessThanOrEqual(
      new Date(second.createdAt).getTime(),
    );
    expect(first.type).toBe('CREATED');
    expect(second.type).toBe('HARVESTED');
  });
});
