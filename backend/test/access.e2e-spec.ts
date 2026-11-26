import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { BatchStatus, UserRole } from '../generated/prisma/enums';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AuthUser } from '../src/auth/auth-user.type';
import { PrismaService } from '../src/prisma/prisma.service';

// Who sees what: each role only reaches its own records; anything else
// answers 404, as if it did not exist.
describe('Isolamento de dados por papel (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const run = String(Date.now()).slice(-8);
  const ids = {
    coopX: '',
    coopY: '',
    producerA: '',
    producerB: '',
    farmA: '',
    farmB: '',
    batchA: '',
    batchB: '',
    batchReceived: '',
  };
  const tokens: Record<string, string> = {};
  const userIds: string[] = [];

  async function tokenFor(
    key: string,
    role: UserRole,
    links: Partial<Pick<AuthUser, 'producerId' | 'cooperativeId'>> = {},
  ) {
    const user = await prisma.user.create({
      data: {
        name: `Acesso ${key}`,
        email: `acesso-${key}-${run}@example.com`,
        passwordHash: 'x',
        role,
        producerId: links.producerId,
        cooperativeId: links.cooperativeId,
      },
    });
    userIds.push(user.id);
    const payload: AuthUser = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role,
      producerId: links.producerId ?? null,
      cooperativeId: links.cooperativeId ?? null,
    };
    tokens[key] = await app.get(JwtService).signAsync(payload);
  }

  const get = (key: string, path: string) =>
    request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${tokens[key]}`);

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(
      moduleFixture.createNestApplication<NestExpressApplication>(),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const coop = (suffix: string) =>
      prisma.cooperative.create({
        data: {
          name: `Coop ${suffix}`,
          document: `7${suffix}${run}00`.slice(0, 14),
          city: 'Rio Verde',
          state: 'GO',
        },
      });
    ids.coopX = (await coop('1')).id;
    ids.coopY = (await coop('2')).id;
    const producer = (suffix: string, cooperativeId: string | null) =>
      prisma.producer.create({
        data: {
          name: `Produtor ${suffix}`,
          phone: `6${suffix}${run}0`.slice(0, 11),
          document: `5${suffix}${run}0`.slice(0, 11),
          cooperativeId,
        },
      });
    ids.producerA = (await producer('1', ids.coopX)).id;
    ids.producerB = (await producer('2', null)).id;
    const farm = (producerId: string) =>
      prisma.farm.create({
        data: {
          name: 'Fazenda Acesso',
          city: 'Rio Verde',
          state: 'GO',
          latitude: -17.8,
          longitude: -50.9,
          producerId,
        },
      });
    ids.farmA = (await farm(ids.producerA)).id;
    ids.farmB = (await farm(ids.producerB)).id;
    const batch = (farmId: string, code: string, status: BatchStatus) =>
      prisma.batch.create({
        data: {
          code: `ACC-${run}-${code}`,
          publicCode: `ACC-${run}-${code}`,
          productType: 'COFFEE',
          quantity: 10,
          unit: 'sacas',
          status,
          farmId,
        },
      });
    ids.batchA = (await batch(ids.farmA, 'A', BatchStatus.CREATED)).id;
    ids.batchB = (await batch(ids.farmB, 'B', BatchStatus.CREATED)).id;
    ids.batchReceived = (await batch(ids.farmA, 'R', BatchStatus.RECEIVED)).id;

    await tokenFor('producerA', UserRole.PRODUCER, {
      producerId: ids.producerA,
    });
    await tokenFor('coopX', UserRole.COOPERATIVE, { cooperativeId: ids.coopX });
    await tokenFor('coopY', UserRole.COOPERATIVE, { cooperativeId: ids.coopY });
    await tokenFor('operator', UserRole.OPERATOR);
    await tokenFor('admin', UserRole.ADMIN);
    // A role whose link is missing must see nothing, never everything.
    await tokenFor('orphan', UserRole.PRODUCER);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.batch.deleteMany({ where: { code: { contains: run } } });
    await prisma.farm.deleteMany({
      where: { id: { in: [ids.farmA, ids.farmB] } },
    });
    await prisma.producer.deleteMany({
      where: { id: { in: [ids.producerA, ids.producerB] } },
    });
    await prisma.cooperative.deleteMany({
      where: { id: { in: [ids.coopX, ids.coopY] } },
    });
    await app?.close();
  });

  const listIds = async (key: string, path: string) =>
    (
      (await get(key, `${path}?limit=100`).expect(200)).body.data as Array<{
        id: string;
      }>
    ).map((item) => item.id);

  it('produtor ve so as proprias fazendas e lotes', async () => {
    const batches = await listIds('producerA', '/batches');
    expect(batches).toEqual(
      expect.arrayContaining([ids.batchA, ids.batchReceived]),
    );
    expect(batches).not.toContain(ids.batchB);
    const farms = await listIds('producerA', '/farms');
    expect(farms).toContain(ids.farmA);
    expect(farms).not.toContain(ids.farmB);

    for (const path of [
      `/batches/${ids.batchB}`,
      `/batches/${ids.batchB}/events`,
      `/batches/${ids.batchB}/events/integrity`,
      `/batches/${ids.batchB}/documents`,
      `/batches/${ids.batchB}/transitions`,
      `/farms/${ids.farmB}`,
    ]) {
      await get('producerA', path).expect(404);
    }
    await get('producerA', `/batches/${ids.batchA}`).expect(200);
  });

  it('produtor nao altera nem gera QR de lote alheio', async () => {
    await request(app.getHttpServer())
      .post(`/batches/${ids.batchB}/qrcode`)
      .set('Authorization', `Bearer ${tokens.producerA}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/batches/${ids.batchB}/status`)
      .set('Authorization', `Bearer ${tokens.producerA}`)
      .send({ status: BatchStatus.HARVESTED })
      .expect(404);
    await request(app.getHttpServer())
      .post('/batches')
      .set('Authorization', `Bearer ${tokens.producerA}`)
      .send({
        farmId: ids.farmB,
        productType: 'COFFEE',
        quantity: 1,
        unit: 'kg',
      })
      .expect(404);
  });

  it('cooperativa ve os produtores dela e os lotes deles', async () => {
    expect(await listIds('coopX', '/batches')).toEqual(
      expect.arrayContaining([ids.batchA, ids.batchReceived]),
    );
    expect(await listIds('coopX', '/batches')).not.toContain(ids.batchB);
    const producers = await listIds('coopX', '/producers');
    expect(producers).toContain(ids.producerA);
    expect(producers).not.toContain(ids.producerB);
    await get('coopX', `/producers/${ids.producerB}`).expect(404);

    const coopY = await listIds('coopY', '/batches');
    expect(coopY).not.toContain(ids.batchA);
    expect(coopY).not.toContain(ids.batchB);
  });

  it('operador ve so lotes ja recebidos pela cooperativa', async () => {
    const batches = await listIds('operator', '/batches');
    expect(batches).toContain(ids.batchReceived);
    expect(batches).not.toContain(ids.batchA);
    expect(batches).not.toContain(ids.batchB);
    await get('operator', `/batches/${ids.batchA}`).expect(404);
    await get('operator', `/batches/${ids.batchReceived}`).expect(200);
  });

  it('conta sem vinculo nao ve nada, e o admin ve tudo', async () => {
    expect(await listIds('orphan', '/batches')).toEqual([]);
    expect(await listIds('orphan', '/farms')).toEqual([]);

    expect(await listIds('admin', '/batches')).toEqual(
      expect.arrayContaining([ids.batchA, ids.batchB, ids.batchReceived]),
    );
  });
});
