import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { EventHashService } from '../src/trace-events/event-hash.service';
import {
  BatchStatus,
  PrismaClient,
  ProductType,
  TokenizationStatus,
  TraceEventType,
  UserRole,
} from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const eventHashService = new EventHashService();

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SEED_DEMO !== 'true'
  ) {
    throw new Error('Seed de demonstracao exige SEED_DEMO=true em producao.');
  }
  const demoPassword = process.env.DEMO_PASSWORD || 'AgroPass@2026';
  if (process.env.NODE_ENV === 'production' && !process.env.DEMO_PASSWORD) {
    throw new Error(
      'Defina DEMO_PASSWORD para criar as contas da demonstracao.',
    );
  }
  const cooperative = await prisma.cooperative.upsert({
    where: { document: '12345678000199' },
    update: {},
    create: {
      name: 'Cooperativa Agro Centro-Oeste',
      document: '12345678000199',
      city: 'Rio Verde',
      state: 'GO',
    },
  });

  const producer = await prisma.producer.upsert({
    where: { document: '12345678901' },
    update: {},
    create: {
      name: 'Carlos Alberto Mendes',
      phone: '64999990001',
      document: '12345678901',
      cooperativeId: cooperative.id,
    },
  });

  const farm = await prisma.farm.upsert({
    where: { carNumber: 'GO-5214-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
    update: {},
    create: {
      name: 'Fazenda Santa Fé',
      city: 'Rio Verde',
      state: 'GO',
      latitude: -17.7988,
      longitude: -50.9398,
      carNumber: 'GO-5214-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      totalAreaHa: 500,
      producerId: producer.id,
    },
  });

  const passwordHash = await hash(demoPassword, 10);

  const producerUser = await prisma.user.upsert({
    where: { email: 'produtor@agropass.local' },
    update: {},
    create: {
      name: producer.name,
      email: 'produtor@agropass.local',
      passwordHash,
      role: UserRole.PRODUCER,
      producerId: producer.id,
    },
  });

  const cooperativeUser = await prisma.user.upsert({
    where: { email: 'cooperativa@agropass.local' },
    update: {},
    create: {
      name: cooperative.name,
      email: 'cooperativa@agropass.local',
      passwordHash,
      role: UserRole.COOPERATIVE,
      cooperativeId: cooperative.id,
    },
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operador@agropass.local' },
    update: {},
    create: {
      name: 'Operador Logistico AgroPass',
      email: 'operador@agropass.local',
      passwordHash,
      role: UserRole.OPERATOR,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@agropass.local' },
    update: {},
    create: {
      name: 'Administrador AgroPass',
      email: 'admin@agropass.local',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const actors = {
    producer: producerUser.id,
    cooperative: cooperativeUser.id,
    operator: operatorUser.id,
    admin: adminUser.id,
  };

  // In progress: shows a passport that is still moving along the chain.
  const inProgress = await seedBatch({
    code: 'AGP-2026-0001',
    farmId: farm.id,
    quantity: 120,
    harvestDate: new Date('2026-06-15T00:00:00.000Z'),
    status: BatchStatus.RECEIVED,
    events: [
      {
        type: TraceEventType.CREATED,
        recordedById: actors.producer,
        location: `${farm.city}, ${farm.state}`,
        latitude: farm.latitude,
        longitude: farm.longitude,
        recordedAt: new Date('2026-06-15T08:00:00.000Z'),
      },
      {
        type: TraceEventType.HARVESTED,
        recordedById: actors.producer,
        location: farm.name,
        recordedAt: new Date('2026-06-16T10:00:00.000Z'),
      },
      {
        type: TraceEventType.RECEIVED,
        recordedById: actors.cooperative,
        location: `${cooperative.city}, ${cooperative.state}`,
        recordedAt: new Date('2026-06-17T14:00:00.000Z'),
      },
    ],
  });

  // Complete: every lifecycle stage, closed and public.
  const complete = await seedBatch({
    code: 'AGP-2026-0002',
    farmId: farm.id,
    quantity: 240,
    harvestDate: new Date('2026-05-20T00:00:00.000Z'),
    status: BatchStatus.CLOSED,
    closedAt: new Date('2026-06-12T15:00:00.000Z'),
    events: [
      {
        type: TraceEventType.CREATED,
        recordedById: actors.producer,
        location: `${farm.city}, ${farm.state}`,
        latitude: farm.latitude,
        longitude: farm.longitude,
        recordedAt: new Date('2026-05-20T09:00:00.000Z'),
      },
      {
        type: TraceEventType.HARVESTED,
        recordedById: actors.producer,
        location: farm.name,
        notes: 'Colheita mecanizada, talhao 2',
        recordedAt: new Date('2026-05-22T11:30:00.000Z'),
      },
      {
        type: TraceEventType.RECEIVED,
        recordedById: actors.cooperative,
        location: `${cooperative.city}, ${cooperative.state}`,
        notes: 'Recebido no armazem central: 240 sacas',
        recordedAt: new Date('2026-05-25T14:00:00.000Z'),
      },
      {
        type: TraceEventType.IN_TRANSIT,
        recordedById: actors.operator,
        location: 'Rio Verde, GO -> Uberlandia, MG',
        notes: 'Carga lacrada',
        recordedAt: new Date('2026-05-30T07:00:00.000Z'),
      },
      {
        type: TraceEventType.PROCESSED,
        recordedById: actors.cooperative,
        location: 'Uberlandia, MG',
        notes: 'Beneficiamento e classificacao',
        recordedAt: new Date('2026-06-03T16:20:00.000Z'),
      },
      {
        type: TraceEventType.DELIVERED,
        recordedById: actors.operator,
        location: 'Porto de Santos, SP',
        notes: 'Entregue no terminal de exportacao',
        recordedAt: new Date('2026-06-10T10:00:00.000Z'),
      },
      {
        type: TraceEventType.CLOSED,
        recordedById: actors.admin,
        recordedAt: new Date('2026-06-12T15:00:00.000Z'),
      },
    ],
  });

  console.log('Traceability seed created:', {
    cooperativeId: cooperative.id,
    producerId: producer.id,
    farmId: farm.id,
    batches: [inProgress.code, complete.code],
    users: actors,
  });
}

type SeedEvent = {
  type: TraceEventType;
  recordedById: string;
  recordedAt: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
};

// Seed is additive: restarts preserve existing passwords, evidence and proofs.
async function seedBatch(input: {
  code: string;
  farmId: string;
  quantity: number;
  harvestDate: Date;
  status: BatchStatus;
  closedAt?: Date;
  events: SeedEvent[];
}) {
  const existing = await prisma.batch.findUnique({
    where: { code: input.code },
  });
  if (existing) return existing;

  return prisma.$transaction(async (transaction) => {
    const fields = {
      farmId: input.farmId,
      productType: ProductType.COFFEE,
      quantity: input.quantity,
      unit: 'sacas',
      harvestDate: input.harvestDate,
      publicCode: input.code,
      isPublic: true,
      integrityHash: null,
      status: input.status,
      closedAt: input.closedAt ?? null,
      createdAt: input.events[0].recordedAt,
      // New demo batches have no real blockchain proof.
      tokenizationStatus: TokenizationStatus.NONE,
      tokenizationAttempts: 0,
      tokenizationStartedAt: null,
      tokenizationError: null,
      proofHash: null,
      tokenAddress: null,
      tokenTxHash: null,
      tokenizedAt: null,
      blockchainNetwork: null,
    };

    const batch = await transaction.batch.create({
      data: { code: input.code, ...fields },
    });

    let previousHash: string | null = null;
    const events = input.events.map((event, index) => {
      const sequence = index + 1;
      const eventHash = eventHashService.generate({
        batchId: batch.id,
        sequence,
        previousHash,
        ...event,
      });
      const data = {
        batchId: batch.id,
        sequence,
        previousHash,
        eventHash,
        ...event,
      };
      previousHash = eventHash;
      return data;
    });

    await transaction.traceEvent.createMany({ data: events });
    await transaction.batch.update({
      where: { id: batch.id },
      data: { integrityHash: previousHash },
    });

    return batch;
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
