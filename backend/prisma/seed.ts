import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { createHash } from 'crypto';
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

function generateEventHash(input: {
  batchId: string;
  sequence: number;
  type: TraceEventType;
  recordedById: string;
  recordedAt: Date;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  previousHash?: string | null;
}): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        batchId: input.batchId,
        sequence: input.sequence,
        type: input.type,
        recordedById: input.recordedById,
        recordedAt: input.recordedAt.toISOString(),
        location: input.location ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        notes: input.notes ?? null,
        previousHash: input.previousHash ?? null,
        documentHashes: [],
        txHash: null,
        correctedEventId: null,
      }),
    )
    .digest('hex');
}

async function main() {
  const cooperative = await prisma.cooperative.upsert({
    where: { document: '12345678000199' },
    update: {
      name: 'Cooperativa Agro Centro-Oeste',
      city: 'Rio Verde',
      state: 'GO',
    },
    create: {
      name: 'Cooperativa Agro Centro-Oeste',
      document: '12345678000199',
      city: 'Rio Verde',
      state: 'GO',
    },
  });

  const producer = await prisma.producer.upsert({
    where: { document: '12345678901' },
    update: {
      name: 'Carlos Alberto Mendes',
      phone: '64999990001',
      cooperativeId: cooperative.id,
    },
    create: {
      name: 'Carlos Alberto Mendes',
      phone: '64999990001',
      document: '12345678901',
      cooperativeId: cooperative.id,
    },
  });

  const farm = await prisma.farm.upsert({
    where: { carNumber: 'GO-5214-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
    update: {
      name: 'Fazenda Santa Fé',
      city: 'Rio Verde',
      state: 'GO',
      latitude: -17.7988,
      longitude: -50.9398,
      totalAreaHa: 500,
      producerId: producer.id,
    },
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

  const passwordHash = await hash('AgroPass@2026', 10);

  const producerUser = await prisma.user.upsert({
    where: { email: 'produtor@agropass.local' },
    update: {
      name: producer.name,
      passwordHash,
      role: UserRole.PRODUCER,
      producerId: producer.id,
      cooperativeId: null,
    },
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
    update: {
      name: cooperative.name,
      passwordHash,
      role: UserRole.COOPERATIVE,
      cooperativeId: cooperative.id,
      producerId: null,
    },
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
    update: {
      name: 'Operador Logistico AgroPass',
      passwordHash,
      role: UserRole.OPERATOR,
      producerId: null,
      cooperativeId: null,
    },
    create: {
      name: 'Operador Logistico AgroPass',
      email: 'operador@agropass.local',
      passwordHash,
      role: UserRole.OPERATOR,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@agropass.local' },
    update: {
      name: 'Administrador AgroPass',
      passwordHash,
      role: UserRole.ADMIN,
      producerId: null,
      cooperativeId: null,
    },
    create: {
      name: 'Administrador AgroPass',
      email: 'admin@agropass.local',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const batch = await prisma.batch.upsert({
    where: { code: 'AGP-2026-0001' },
    update: {
      farmId: farm.id,
      productType: ProductType.COFFEE,
      quantity: 120,
      unit: 'sacas',
      publicCode: 'AGP-2026-0001',
      isPublic: true,
      integrityHash: null,
      status: BatchStatus.RECEIVED,
      closedAt: null,
      // The chain is rebuilt below, so any previous proof no longer applies.
      tokenizationStatus: TokenizationStatus.NONE,
      tokenizationAttempts: 0,
      tokenizationStartedAt: null,
      tokenizationError: null,
      proofHash: null,
      tokenAddress: null,
      tokenTxHash: null,
      tokenizedAt: null,
      blockchainNetwork: null,
    },
    create: {
      code: 'AGP-2026-0001',
      publicCode: 'AGP-2026-0001',
      isPublic: true,
      integrityHash: null,
      farmId: farm.id,
      productType: ProductType.COFFEE,
      quantity: 120,
      unit: 'sacas',
      harvestDate: new Date('2026-06-15T00:00:00.000Z'),
      status: BatchStatus.RECEIVED,
    },
  });

  await prisma.document.deleteMany({ where: { batchId: batch.id } });
  await prisma.traceEvent.deleteMany({ where: { batchId: batch.id } });
  const eventDefinitions = [
    {
      type: TraceEventType.CREATED,
      recordedById: producerUser.id,
      location: `${farm.city}, ${farm.state}`,
      latitude: farm.latitude,
      longitude: farm.longitude,
      recordedAt: new Date('2026-06-15T08:00:00.000Z'),
    },
    {
      type: TraceEventType.HARVESTED,
      recordedById: producerUser.id,
      location: farm.name,
      recordedAt: new Date('2026-06-16T10:00:00.000Z'),
    },
    {
      type: TraceEventType.RECEIVED,
      recordedById: cooperativeUser.id,
      location: `${cooperative.city}, ${cooperative.state}`,
      recordedAt: new Date('2026-06-17T14:00:00.000Z'),
    },
  ];

  let previousHash: string | null = null;
  const events = eventDefinitions.map((event, index) => {
    const sequence = index + 1;
    const eventHash = generateEventHash({
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

  await prisma.traceEvent.createMany({ data: events });
  await prisma.batch.update({
    where: { id: batch.id },
    data: { integrityHash: previousHash },
  });

  console.log('Traceability seed created:', {
    cooperativeId: cooperative.id,
    producerId: producer.id,
    farmId: farm.id,
    batchId: batch.id,
    batchCode: batch.code,
    users: {
      producer: producerUser.id,
      cooperative: cooperativeUser.id,
      operator: operatorUser.id,
      admin: adminUser.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
