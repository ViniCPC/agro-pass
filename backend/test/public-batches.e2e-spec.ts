import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { BatchStatus, UserRole } from '../generated/prisma/enums';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { BLOCKCHAIN_PROOF_PROVIDER } from '../src/blockchain/blockchain-proof.provider';
import type { LocalProofProvider } from '../src/blockchain/local-proof.provider';

describe('Digital passport authentication and lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let cooperativeId: string;
  let producerId: string;
  let otherProducerId: string;
  let farmId: string;
  let otherFarmId: string;
  let batchId: string;
  let publicCode: string;

  let producerToken: string;
  let cooperativeToken: string;
  let operatorToken: string;
  let adminToken: string;
  let producerUserId: string;
  let uploadedFilePath: string | undefined;

  const suffix = `${Date.now()}`;
  const password = 'SenhaForte@2026';
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const proofProvider = () =>
    app.get<LocalProofProvider>(BLOCKCHAIN_PROOF_PROVIDER);

  // Closing registers the proof in the background: poll until it settles.
  async function waitForTokenization(status: string) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const response = await request(app.getHttpServer())
        .get(`/batches/${batchId}`)
        .set(auth(adminToken))
        .expect(200);
      const batch = response.body as { blockchain: { status: string } };
      if (batch.blockchain.status === status) return response.body;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Tokenizacao nao chegou a ${status}`);
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Same HTTP setup as production (helmet, CORS, validation).
    app = configureApp(
      moduleFixture.createNestApplication<NestExpressApplication>(),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    const cooperative = await prisma.cooperative.create({
      data: {
        name: 'Cooperativa E2E',
        document: `coop-${suffix}`,
        city: 'Rio Verde',
        state: 'GO',
      },
    });
    cooperativeId = cooperative.id;

    const producer = await prisma.producer.create({
      data: {
        name: 'Produtor E2E',
        phone: `64${suffix.slice(-9)}`,
        document: `producer-${suffix}`,
        cooperativeId,
      },
    });
    producerId = producer.id;

    const otherProducer = await prisma.producer.create({
      data: {
        name: 'Outro Produtor E2E',
        phone: `65${suffix.slice(-9)}`,
        document: `other-${suffix}`,
      },
    });
    otherProducerId = otherProducer.id;

    const farm = await prisma.farm.create({
      data: {
        name: 'Fazenda E2E',
        city: 'Rio Verde',
        state: 'GO',
        latitude: -17.79,
        longitude: -50.93,
        producerId,
      },
    });
    farmId = farm.id;

    const otherFarm = await prisma.farm.create({
      data: {
        name: 'Fazenda de Outro Produtor',
        city: 'Jatai',
        state: 'GO',
        latitude: -17.88,
        longitude: -51.71,
        producerId: otherProducerId,
      },
    });
    otherFarmId = otherFarm.id;

    const producerRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Produtor Autenticado',
        email: `producer-${suffix}@example.com`,
        password,
        role: UserRole.PRODUCER,
        producerId,
      })
      .expect(201);
    producerToken = producerRegistration.body.accessToken;
    producerUserId = producerRegistration.body.user.id;
    expect(producerRegistration.body).not.toHaveProperty('passwordHash');
    expect(producerRegistration.body.user).not.toHaveProperty('passwordHash');

    cooperativeToken = (
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Cooperativa Autenticada',
          email: `cooperative-${suffix}@example.com`,
          password,
          role: UserRole.COOPERATIVE,
          cooperativeId,
        })
        .expect(201)
    ).body.accessToken;

    operatorToken = (
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Operador Autenticado',
          email: `operator-${suffix}@example.com`,
          password,
          role: UserRole.OPERATOR,
        })
        .expect(201)
    ).body.accessToken;

    await prisma.user.create({
      data: {
        name: 'Administrador E2E',
        email: `admin-${suffix}@example.com`,
        passwordHash: await hash(password, 4),
        role: UserRole.ADMIN,
      },
    });

    adminToken = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `admin-${suffix}@example.com`, password })
        .expect(201)
    ).body.accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      if (batchId) {
        await prisma.document.deleteMany({ where: { batchId } });
        await prisma.traceEvent.deleteMany({ where: { batchId } });
        await prisma.batch.deleteMany({ where: { id: batchId } });
      }
      await prisma.user.deleteMany({
        where: { email: { endsWith: `-${suffix}@example.com` } },
      });
      await prisma.farm.deleteMany({
        where: { id: { in: [farmId, otherFarmId].filter(Boolean) } },
      });
      await prisma.producer.deleteMany({
        where: {
          id: { in: [producerId, otherProducerId].filter(Boolean) },
        },
      });
      await prisma.cooperative.deleteMany({ where: { id: cooperativeId } });
    }
    if (uploadedFilePath) {
      await unlink(uploadedFilePath).catch(() => undefined);
    }
    await app?.close();
  });

  it('retorna 401 sem token e /auth/me retorna usuario sem senha', async () => {
    await request(app.getHttpServer()).get('/batches').expect(401);

    const { body } = await request(app.getHttpServer())
      .get('/auth/me')
      .set(auth(producerToken))
      .expect(200);

    expect(body).toMatchObject({
      id: producerUserId,
      role: UserRole.PRODUCER,
      producerId,
    });
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('aplica papel e propriedade ao criar o lote', async () => {
    await request(app.getHttpServer())
      .post('/batches')
      .set(auth(operatorToken))
      .send({ farmId, productType: 'COFFEE', quantity: 50, unit: 'sacas' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/batches')
      .set(auth(producerToken))
      .send({
        farmId: otherFarmId,
        productType: 'COFFEE',
        quantity: 50,
        unit: 'sacas',
      })
      .expect(403);

    const { body } = await request(app.getHttpServer())
      .post('/batches')
      .set(auth(producerToken))
      .send({ farmId, productType: 'COFFEE', quantity: 50, unit: 'sacas' })
      .expect(201);

    batchId = body.id;
    publicCode = body.publicCode;
    expect(body.code).toMatch(/^AGP-\d{4}-\d{4}$/);
    expect(body.publicCode).toBe(body.code);
    expect(body.farm.name).toBe('Fazenda E2E');
  });

  it('mantem passaporte privado ate um admin publica-lo', async () => {
    await request(app.getHttpServer())
      .get(`/public/batches/${publicCode}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/visibility`)
      .set(auth(producerToken))
      .send({ isPublic: true })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/visibility`)
      .set(auth(adminToken))
      .send({ isPublic: true })
      .expect(200);

    const { body } = await request(app.getHttpServer())
      .get(`/public/batches/${publicCode}`)
      .expect(200);
    expect(body.batch).toMatchObject({
      id: batchId,
      publicCode,
      isPublic: true,
      status: BatchStatus.CREATED,
    });
  });

  it('anexa documento com metadados e cria um evento encadeado', async () => {
    // A file named .pdf whose bytes are not a PDF is rejected.
    await request(app.getHttpServer())
      .post(`/batches/${batchId}/documents`)
      .set(auth(cooperativeToken))
      .field('type', 'INVOICE')
      .attach('file', Buffer.from('MZ disguised executable'), {
        filename: 'nota.pdf',
        contentType: 'application/pdf',
      })
      .expect(400)
      .expect(({ body }) =>
        expect(body.message).toContain('nao corresponde a um PDF'),
      );

    // Oversized uploads are cut off by multer before reaching the service.
    await request(app.getHttpServer())
      .post(`/batches/${batchId}/documents`)
      .set(auth(cooperativeToken))
      .field('type', 'INVOICE')
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1, 0x25), {
        filename: 'grande.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);

    const fileContents = Buffer.from(
      '%PDF-1.4\n% comprovante auditavel do lote\n%%EOF\n',
    );
    const { body: document } = await request(app.getHttpServer())
      .post(`/batches/${batchId}/documents`)
      .set(auth(cooperativeToken))
      .field('type', 'INVOICE')
      .attach('file', fileContents, {
        filename: 'comprovante.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    uploadedFilePath = join(
      process.cwd(),
      document.fileUrl.replace(/^\/uploads\//, 'uploads/'),
    );
    expect(document).toMatchObject({
      type: 'INVOICE',
      originalName: 'comprovante.pdf',
      size: fileContents.length,
      mimeType: 'application/pdf',
      batchId,
    });
    expect(document.fileHash).toMatch(/^[a-f0-9]{64}$/);
    expect(document.traceEventId).toBeTruthy();

    const { body: events } = await request(app.getHttpServer())
      .get(`/batches/${batchId}/events`)
      .set(auth(producerToken))
      .expect(200);

    expect(events).toHaveLength(2);
    expect(events.map((event: { sequence: number }) => event.sequence)).toEqual(
      [1, 2],
    );
    expect(events[0].previousHash).toBeNull();
    expect(events[1]).toMatchObject({
      type: 'DOCUMENT_ATTACHED',
      previousHash: events[0].eventHash,
      recordedById: expect.any(String),
    });
    expect(events[1].documents[0]).toMatchObject({
      id: document.id,
      mimeType: 'application/pdf',
      size: fileContents.length,
    });

    const { body: integrity } = await request(app.getHttpServer())
      .get(`/batches/${batchId}/events/integrity`)
      .set(auth(producerToken))
      .expect(200);
    expect(integrity).toMatchObject({ valid: true, eventCount: 2 });
    expect(integrity.finalHash).toBe(events[1].eventHash);

    await request(app.getHttpServer())
      .get(`/public/batches/${publicCode}/integrity`)
      .expect(200)
      .expect(({ body }) => expect(body.valid).toBe(true));

    // Documents start restricted: the passport shows the hash, not the file.
    expect(document.isPublic).toBe(false);
    await request(app.getHttpServer()).get(document.fileUrl).expect(404);
    await request(app.getHttpServer())
      .get(`/batches/${batchId}/documents/${document.id}/file`)
      .expect(401);
    await request(app.getHttpServer())
      .get(`/batches/${batchId}/documents/${document.id}/file`)
      .set(auth(cooperativeToken))
      .expect(200);
    const findPublicDocument = (body: { documents: Array<{ id: string }> }) =>
      body.documents.find((item) => item.id === document.id);

    const { body: restricted } = await request(app.getHttpServer())
      .get(`/public/batches/${publicCode}`)
      .expect(200);
    expect(findPublicDocument(restricted)).toMatchObject({
      isPublic: false,
      fileUrl: null,
      originalName: null,
      fileHash: document.fileHash,
    });
    expect(restricted.traceEvents[1].notes).toBeNull();
    expect(JSON.stringify(restricted)).not.toContain('comprovante.pdf');

    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/documents/${document.id}/visibility`)
      .set(auth(producerToken))
      .send({ isPublic: true })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/documents/${document.id}/visibility`)
      .set(auth(cooperativeToken))
      .send({ isPublic: true })
      .expect(200)
      .expect(({ body }) => expect(body.isPublic).toBe(true));

    const { body: published } = await request(app.getHttpServer())
      .get(`/public/batches/${publicCode}`)
      .expect(200);
    expect(findPublicDocument(published)).toMatchObject({
      isPublic: true,
      fileUrl: document.fileUrl,
      originalName: 'comprovante.pdf',
    });
    // Visibility lives outside the hashed event, so the chain stays valid.
    expect(published.integrity.valid).toBe(true);
    await request(app.getHttpServer())
      .get(document.fileUrl)
      .expect(200)
      .expect('Cache-Control', 'private, no-store');
    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/visibility`)
      .set(auth(adminToken))
      .send({ isPublic: false })
      .expect(200);
    await request(app.getHttpServer()).get(document.fileUrl).expect(404);
    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/visibility`)
      .set(auth(adminToken))
      .send({ isPublic: true })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/documents/${document.id}/visibility`)
      .set(auth(cooperativeToken))
      .send({ isPublic: false })
      .expect(200);
    await request(app.getHttpServer()).get(document.fileUrl).expect(404);
  });

  it('registra uma correcao como novo evento sem alterar o original', async () => {
    const { body: before } = await request(app.getHttpServer())
      .get(`/batches/${batchId}/events`)
      .set(auth(adminToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/batches/${batchId}/events`)
      .set(auth(producerToken))
      .send({
        type: 'CORRECTION',
        notes: 'Tentativa sem permissao',
        correctedEventId: before[0].id,
      })
      .expect(403);

    const { body: correction } = await request(app.getHttpServer())
      .post(`/batches/${batchId}/events`)
      .set(auth(adminToken))
      .send({
        type: 'CORRECTION',
        notes: 'Localizacao do registro original conferida manualmente.',
        correctedEventId: before[0].id,
      })
      .expect(201);

    expect(correction).toMatchObject({
      type: 'CORRECTION',
      sequence: 3,
      previousHash: before[1].eventHash,
      correctedEventId: before[0].id,
    });
    expect(correction.eventHash).toMatch(/^[a-f0-9]{64}$/);

    const { body: original } = await request(app.getHttpServer())
      .get(`/batches/${batchId}/events`)
      .set(auth(adminToken))
      .expect(200);
    expect(original[0]).toEqual(before[0]);
  });

  it('rejeita transicao invalida e papel incorreto', async () => {
    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/status`)
      .set(auth(operatorToken))
      .send({ status: BatchStatus.DELIVERED })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/status`)
      .set(auth(operatorToken))
      .send({ status: BatchStatus.HARVESTED })
      .expect(403);
  });

  it('registra cada etapa com o usuario do JWT e fecha o passaporte', async () => {
    await request(app.getHttpServer())
      .patch(`/batches/${batchId}/status`)
      .set(auth(producerToken))
      .send({ status: BatchStatus.HARVESTED })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/batches/${batchId}/events`)
      .set(auth(producerToken))
      .send({
        type: 'HARVESTED',
        actorName: 'Nome Forjado',
      })
      .expect(400);

    const stages = [
      [BatchStatus.RECEIVED, cooperativeToken],
      [BatchStatus.IN_TRANSIT, operatorToken],
      [BatchStatus.PROCESSED, cooperativeToken],
      [BatchStatus.DELIVERED, operatorToken],
    ] as const;

    for (const [status, token] of stages) {
      await request(app.getHttpServer())
        .patch(`/batches/${batchId}/status`)
        .set(auth(token))
        .send({ status })
        .expect(200);
    }

    // Solana is down while the batch closes: closing must succeed anyway.
    const outage = jest
      .spyOn(proofProvider(), 'register')
      .mockRejectedValue(new Error('Solana indisponivel (simulado)'));

    const closed = await request(app.getHttpServer())
      .patch(`/batches/${batchId}/close`)
      .set(auth(adminToken))
      .expect(200);
    expect(closed.body.status).toBe(BatchStatus.CLOSED);
    expect(closed.body.closedAt).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/batches/${batchId}/events`)
      .set(auth(operatorToken))
      .send({ type: 'IN_TRANSIT' })
      .expect(400);

    const { body } = await request(app.getHttpServer())
      .get(`/public/batches/${publicCode}`)
      .expect(200);

    expect(
      body.traceEvents.map((event: { type: string }) => event.type),
    ).toEqual([
      'CREATED',
      'DOCUMENT_ATTACHED',
      'CORRECTION',
      'HARVESTED',
      'RECEIVED',
      'IN_TRANSIT',
      'PROCESSED',
      'DELIVERED',
      'CLOSED',
    ]);
    const producerActor = {
      name: 'Produtor Autenticado',
      role: UserRole.PRODUCER,
    };
    expect(body.traceEvents[0]).toMatchObject({
      actorName: producerActor.name,
      actor: producerActor,
    });
    expect(body.traceEvents[3]).toMatchObject({ actor: producerActor });
    expect(body.integrity).toMatchObject({ valid: true, eventCount: 9 });

    // Public passports never expose account identifiers or contact data.
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(producerUserId);
    expect(serialized).not.toContain('recordedById');
    expect(serialized).not.toContain('@example.com');
    expect(serialized).not.toContain(`producer-${suffix}`);

    // The failed proof is recorded on the batch, which stays closed and intact.
    const failed = await waitForTokenization('FAILED');
    expect(failed).toMatchObject({
      status: BatchStatus.CLOSED,
      tokenAddress: null,
      blockchain: {
        status: 'FAILED',
        attempts: 3,
        proofHash: null,
        error: expect.stringContaining('Solana indisponivel'),
      },
    });
    outage.mockRestore();

    await request(app.getHttpServer())
      .get(`/public/batches/${publicCode}/integrity`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ valid: true, eventCount: 9 }),
      );
  });

  it('registra a prova uma unica vez, com o mesmo hash exibido no passaporte', async () => {
    const register = jest.spyOn(proofProvider(), 'register');

    await request(app.getHttpServer())
      .post(`/batches/${batchId}/tokenize`)
      .set(auth(producerToken))
      .expect(403);

    const { body: proof } = await request(app.getHttpServer())
      .post(`/batches/${batchId}/tokenize`)
      .set(auth(adminToken))
      .expect(200);
    expect(proof).toMatchObject({
      status: 'CONFIRMED',
      network: 'local',
      txHash: expect.stringMatching(/^local-tx-/),
      tokenAddress: expect.stringMatching(/^local-token-/),
      tokenizedAt: expect.any(String),
    });

    // Retrying a confirmed batch returns the same proof and never mints again.
    const { body: again } = await request(app.getHttpServer())
      .post(`/batches/${batchId}/tokenize`)
      .set(auth(adminToken))
      .expect(200);
    expect(again.txHash).toBe(proof.txHash);
    expect(register).toHaveBeenCalledTimes(1);

    const sentHash = register.mock.calls[0][0].chainHash;
    const { body: passport } = await request(app.getHttpServer())
      .get(`/public/batches/${publicCode}`)
      .expect(200);
    expect(passport.blockchain).toMatchObject({
      status: 'CONFIRMED',
      proofHash: sentHash,
      txHash: proof.txHash,
    });
    expect(passport.integrity.finalHash).toBe(sentHash);
    expect(passport.batch.integrityHash).toBe(sentHash);
    // The proof lives on the batch: the closed chain gains no event.
    expect(passport.traceEvents.at(-1).type).toBe('CLOSED');
    register.mockRestore();
  });

  it('detecta adulteracao manual e nao oferece exclusao de eventos', async () => {
    const events = await prisma.traceEvent.findMany({
      where: { batchId },
      orderBy: { sequence: 'asc' },
    });
    const target = events[1];

    await request(app.getHttpServer())
      .delete(`/batches/${batchId}/events/${target.id}`)
      .set(auth(adminToken))
      .expect(404);

    await prisma.traceEvent.update({
      where: { id: target.id },
      data: { location: 'Local adulterado diretamente no banco' },
    });

    const { body: invalid } = await request(app.getHttpServer())
      .get(`/batches/${batchId}/events/integrity`)
      .set(auth(adminToken))
      .expect(200);
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sequence: target.sequence,
          code: 'INVALID_EVENT_HASH',
        }),
      ]),
    );

    await prisma.traceEvent.update({
      where: { id: target.id },
      data: { location: target.location },
    });
    await request(app.getHttpServer())
      .get(`/batches/${batchId}/events/integrity`)
      .set(auth(adminToken))
      .expect(200)
      .expect(({ body }) => expect(body.valid).toBe(true));
  });

  it('senha armazenada e hash, nunca texto puro', async () => {
    const stored = await prisma.user.findUnique({
      where: { id: producerUserId },
      select: { passwordHash: true },
    });

    expect(stored?.passwordHash).toBeTruthy();
    expect(stored?.passwordHash).not.toBe(password);
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
  });
});
