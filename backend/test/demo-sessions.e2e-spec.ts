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
import { DemoSessionsService } from '../src/demo-sessions/demo-sessions.service';
import { PrismaService } from '../src/prisma/prisma.service';

type Account = { accessToken: string; user: AuthUser & { id: string } };

describe('Demo sem cadastro (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accounts: Record<UserRole, Account>;
  let sessionId: string;
  let realAdminToken: string;
  let realAdminId: string;
  let realFarmId: string;
  let realProducerId: string;
  const run = String(Date.now()).slice(-8);

  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(
      moduleFixture.createNestApplication<NestExpressApplication>(),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const realProducer = await prisma.producer.create({
      data: {
        name: 'Produtor Real',
        phone: `69${run}0`.slice(0, 11),
        document: `69${run}0`.slice(0, 11),
      },
    });
    realProducerId = realProducer.id;
    realFarmId = (
      await prisma.farm.create({
        data: {
          name: 'Fazenda Real',
          city: 'Jataí',
          state: 'GO',
          latitude: -17.88,
          longitude: -51.71,
          producerId: realProducer.id,
        },
      })
    ).id;
    const admin = await prisma.user.create({
      data: {
        name: 'Admin Real',
        email: `admin-real-${run}@example.com`,
        passwordHash: 'x',
        role: UserRole.ADMIN,
      },
    });
    realAdminId = admin.id;
    const payload: AuthUser = {
      sub: admin.id,
      name: admin.name,
      email: admin.email,
      role: UserRole.ADMIN,
      producerId: null,
      cooperativeId: null,
    };
    realAdminToken = await app.get(JwtService).signAsync(payload);
  });

  afterAll(async () => {
    await prisma.farm.deleteMany({ where: { id: realFarmId } });
    await prisma.producer.deleteMany({ where: { id: realProducerId } });
    await prisma.user.deleteMany({ where: { id: realAdminId } });
    await app?.close();
  });

  it('cria uma sessao com uma conta por papel e uma fazenda pronta', async () => {
    const { body } = await http().post('/auth/demo').expect(201);
    accounts = body.accounts;

    expect(Object.keys(accounts).sort()).toEqual(
      ['ADMIN', 'COOPERATIVE', 'OPERATOR', 'PRODUCER'].sort(),
    );
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    for (const role of Object.keys(accounts) as UserRole[]) {
      expect(accounts[role].user.role).toBe(role);
      expect(accounts[role].user).not.toHaveProperty('passwordHash');
    }
    sessionId = accounts.ADMIN.user.demoSessionId!;
    expect(sessionId).toEqual(expect.any(String));

    const farms = await http()
      .get('/farms')
      .set(as(accounts.ADMIN.accessToken))
      .expect(200);
    expect(farms.body.data).toHaveLength(1);
    expect(farms.body.data[0].name).toBe('Fazenda Boa Vista');
  });

  it('isola a demo dos dados reais, nos dois sentidos', async () => {
    const demoAdmin = as(accounts.ADMIN.accessToken);
    await http().get(`/farms/${realFarmId}`).set(demoAdmin).expect(404);
    const producers = await http()
      .get('/producers?limit=100')
      .set(demoAdmin)
      .expect(200);
    expect(producers.body.data.map((p: { id: string }) => p.id)).not.toContain(
      realProducerId,
    );
    // Leads and bulk imports are never available to a demo account.
    await http().get('/demo-requests').set(demoAdmin).expect(403);
    // Cannot attach a farm to a real producer.
    await http()
      .post('/farms')
      .set(demoAdmin)
      .send({
        name: 'Invasora',
        city: 'Jataí',
        state: 'GO',
        latitude: -17.8,
        longitude: -51.7,
        producerId: realProducerId,
      })
      .expect(404);

    const realFarms = await http()
      .get('/farms?limit=100')
      .set(as(realAdminToken))
      .expect(200);
    const demoFarm = await prisma.farm.findFirst({
      where: { producer: { demoSessionId: sessionId } },
    });
    expect(realFarms.body.data.map((f: { id: string }) => f.id)).not.toContain(
      demoFarm!.id,
    );
    await http()
      .get(`/farms/${demoFarm!.id}`)
      .set(as(realAdminToken))
      .expect(404);
  });

  it('percorre o ciclo inteiro na demo, trocando de papel', async () => {
    const farmId = (await prisma.farm.findFirst({
      where: { producer: { demoSessionId: sessionId } },
    }))!.id;
    const created = await http()
      .post('/batches')
      .set(as(accounts.PRODUCER.accessToken))
      .send({ farmId, productType: 'COFFEE', quantity: 40, unit: 'sacas' })
      .expect(201);
    // Demo batches never take a real AGP- code.
    expect(created.body.code).toMatch(/^DEMO-\d{4}-\d{4}$/);
    const batchId = created.body.id as string;

    const steps: Array<[UserRole, BatchStatus]> = [
      [UserRole.PRODUCER, BatchStatus.HARVESTED],
      [UserRole.COOPERATIVE, BatchStatus.RECEIVED],
      [UserRole.OPERATOR, BatchStatus.IN_TRANSIT],
      [UserRole.COOPERATIVE, BatchStatus.PROCESSED],
      [UserRole.OPERATOR, BatchStatus.DELIVERED],
    ];
    for (const [role, status] of steps) {
      await http()
        .patch(`/batches/${batchId}/status`)
        .set(as(accounts[role].accessToken))
        .send({ status, location: 'Patrocínio/MG' })
        .expect(200);
    }
    const closed = await http()
      .patch(`/batches/${batchId}/close`)
      .set(as(accounts.ADMIN.accessToken))
      .expect(200);
    expect(closed.body.status).toBe(BatchStatus.CLOSED);

    // Still invisible to the real admin.
    await http().get(`/batches/${batchId}`).set(as(realAdminToken)).expect(404);
  });

  it('a limpeza apaga a sessao expirada com tudo o que ela criou', async () => {
    // Let the background proof settle before deleting.
    for (let i = 0; i < 50; i++) {
      const pending = await prisma.batch.count({
        where: {
          farm: { producer: { demoSessionId: sessionId } },
          tokenizationStatus: 'PENDING',
        },
      });
      if (pending === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await prisma.demoSession.update({
      where: { id: sessionId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await app.get(DemoSessionsService).cleanupExpired();

    expect(await prisma.demoSession.count({ where: { id: sessionId } })).toBe(
      0,
    );
    expect(
      await prisma.user.count({ where: { demoSessionId: sessionId } }),
    ).toBe(0);
    expect(
      await prisma.producer.count({ where: { demoSessionId: sessionId } }),
    ).toBe(0);
    expect(
      await prisma.batch.count({
        where: {
          code: { startsWith: 'DEMO-' },
          farm: { producer: { demoSessionId: sessionId } },
        },
      }),
    ).toBe(0);
    // The real data is untouched.
    expect(await prisma.farm.count({ where: { id: realFarmId } })).toBe(1);
  });
});
