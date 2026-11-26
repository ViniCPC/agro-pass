import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '../generated/prisma/enums';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Cadastro de produtor (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  // Unique per run: document and phone are unique in the database.
  const run = String(Date.now()).slice(-9);
  const document = `11${run}`; // 11 digits (CPF)
  const phone = `64${run}`; // 11 digits
  const email = `signup-${run}@example.com`;
  let cooperativeId: string;
  let inviteCode: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(
      moduleFixture.createNestApplication<NestExpressApplication>(),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const cooperative = await prisma.cooperative.create({
      data: {
        name: 'Cooperativa Convite E2E',
        document: `99${run}000`,
        city: 'Rio Verde',
        state: 'GO',
      },
    });
    cooperativeId = cooperative.id;
    inviteCode = cooperative.inviteCode;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await prisma.farm.deleteMany({ where: { producer: { document } } });
    await prisma.producer.deleteMany({
      where: { document: { in: [document, `22${run}`] } },
    });
    await prisma.cooperative.delete({ where: { id: cooperativeId } });
    await app?.close();
  });

  it('cria usuario produtor e o registro do produtor, aceitando CPF e telefone formatados', async () => {
    const formattedCpf = `${document.slice(0, 3)}.${document.slice(3, 6)}.${document.slice(6, 9)}-${document.slice(9)}`;
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Ana Souza',
        email: email.toUpperCase(),
        password: 'senha-segura',
        phone: `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`,
        document: formattedCpf,
        inviteCode,
      })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email,
      role: UserRole.PRODUCER,
      cooperativeId: null,
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');

    const producer = await prisma.producer.findUnique({
      where: { id: response.body.user.producerId },
    });
    expect(producer).toMatchObject({
      name: 'Ana Souza',
      document,
      phone,
      cooperativeId,
    });

    // The new account works right away: login, and it can create a property.
    const token = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'senha-segura' })
        .expect(201)
    ).body.accessToken;
    await request(app.getHttpServer())
      .post('/farms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sítio da Ana',
        city: 'Rio Verde',
        state: 'GO',
        latitude: -17.79,
        longitude: -50.93,
        producerId: response.body.user.producerId,
      })
      .expect(201);
  });

  it('recusa email ou CPF ja cadastrados, sem criar nada pela metade', async () => {
    const duplicateEmail = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Outra Pessoa',
        email,
        password: 'senha-segura',
        phone: `65${run}`,
        document: `22${run}`,
      })
      .expect(409);
    expect(duplicateEmail.body.message).toMatch(/email já tem uma conta/);
    expect(
      await prisma.producer.findUnique({ where: { document: `22${run}` } }),
    ).toBeNull();

    const duplicateDocument = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Outra Pessoa',
        email: `outra-${run}@example.com`,
        password: 'senha-segura',
        phone: `65${run}`,
        document,
      })
      .expect(409);
    expect(duplicateDocument.body.message).toMatch(/CPF\/CNPJ/);
  });

  it('nao deixa escolher papel nem vincular produtor existente', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Tentativa',
        email: `papel-${run}@example.com`,
        password: 'senha-segura',
        phone: `66${run}`,
        document: `33${run}`,
        role: UserRole.ADMIN,
      })
      .expect(400);
    expect(JSON.stringify(response.body.message)).toMatch(/role/);
  });

  it('recusa codigo de convite inexistente', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Convite Errado',
        email: `convite-${run}@example.com`,
        password: 'senha-segura',
        phone: `67${run}`,
        document: `44${run}`,
        inviteCode: '00000000-0000-4000-8000-000000000000',
      })
      .expect(400);
    expect(response.body.message).toMatch(/Código de convite não encontrado/);
  });
});
