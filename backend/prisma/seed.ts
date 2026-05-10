import { PrismaPg } from '@prisma/adapter-pg';
import {
  Biome,
  FarmStatus,
  Prisma,
  PrismaClient,
  ValidationStatus,
} from '../generated/prisma/client';
import { EUDR_DEMO_CACHE } from '../src/eudr/demo/eudr-demo-cache';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CUTOFF_DATE = new Date('2020-12-31T00:00:00.000Z');
const VALIDITY_MONTHS = 6;

function validUntilDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + VALIDITY_MONTHS);
  return d;
}

const DEMO_FARM_NAMES: Record<string, string> = {
  'DEMO-COMPLIANT-01': 'Fazenda Boa Esperança',
  'DEMO-COMPLIANT-02': 'Sítio Vale Verde',
  'DEMO-COMPLIANT-03': 'Fazenda Floresta Viva',
  'DEMO-REVIEW-01': 'Fazenda Cerradão',
  'DEMO-NON-COMPLIANT-01': 'Fazenda São Benedito',
};

async function main() {
  const producer = await prisma.producer.upsert({
    where: { document: '12345678901' },
    update: { name: 'Carlos Alberto Mendes', phone: '64999990001' },
    create: {
      name: 'Carlos Alberto Mendes',
      phone: '64999990001',
      document: '12345678901',
    },
  });
  console.log('Producer:', producer.id);

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
      legalReserveAreaHa: 100,
      appAreaHa: 20,
      consolidatedAreaHa: 380,
      biome: Biome.CERRADO,
      isAmazonLegal: false,
      status: FarmStatus.APPROVED,
      producerId: producer.id,
    },
  });
  console.log('Farm:', farm.id);

  const demoFarmCoords = [
    { latitude: -17.81, longitude: -50.92, city: 'Rio Verde', state: 'GO' },
    { latitude: -21.24, longitude: -45.0, city: 'Lavras', state: 'MG' },
    { latitude: -3.13, longitude: -60.02, city: 'Manaus', state: 'AM' },
    { latitude: -16.67, longitude: -49.25, city: 'Goiânia', state: 'GO' },
    { latitude: -5.36, longitude: -49.12, city: 'Marabá', state: 'PA' },
  ];

  for (const [index, demoFarm] of EUDR_DEMO_CACHE.entries()) {
    const coords = demoFarmCoords[index];
    const farmStatus =
      demoFarm.status === 'COMPLIANT'
        ? FarmStatus.APPROVED
        : demoFarm.status === 'NON_COMPLIANT'
          ? FarmStatus.REJECTED
          : FarmStatus.PENDING;
    const validationStatus = toPrismaValidationStatus(demoFarm.status);
    const evidenceHash = `demo-eudr-${demoFarm.farmCode}`;

    const farmName = DEMO_FARM_NAMES[demoFarm.farmCode] ?? `Fazenda ${demoFarm.farmCode}`;

    const demoFarmRow = await prisma.farm.upsert({
      where: { carNumber: `DEMO-CAR-${demoFarm.farmCode}` },
      update: {
        name: farmName,
        demoCode: demoFarm.farmCode,
        totalAreaHa: demoFarm.totalAreaHa,
        status: farmStatus,
      },
      create: {
        name: farmName,
        city: coords.city,
        state: coords.state,
        latitude: coords.latitude,
        longitude: coords.longitude,
        carNumber: `DEMO-CAR-${demoFarm.farmCode}`,
        demoCode: demoFarm.farmCode,
        totalAreaHa: demoFarm.totalAreaHa,
        biome: toPrismaBiome(demoFarm.biome),
        status: farmStatus,
        producerId: producer.id,
      },
    });

    // Idempotent: remove existing demo validation then recreate
    await prisma.eudrValidation.deleteMany({
      where: { farmId: demoFarmRow.id, evidenceHash },
    });

    const validation = await prisma.eudrValidation.create({
      data: {
        farmId: demoFarmRow.id,
        status: validationStatus,
        cutoffDate: CUTOFF_DATE,
        hectaresDeforested: demoFarm.deforestedAreaHa,
        ndviBefore: demoFarm.sentinel.ndviBefore,
        ndviAfter: demoFarm.sentinel.ndviAfter,
        satelliteImageBeforeUrl: null,
        satelliteImageAfterUrl: null,
        evidenceHash,
        validUntil: validUntilDate(),
        mapBiomasResult: demoFarm.mapBiomasAlerts.length > 0
          ? { alerts: demoFarm.mapBiomasAlerts, source: 'MapBiomas Alerta Demo Cache' }
          : Prisma.DbNull,
        prodesResult: Prisma.DbNull,
        hansenResult: Prisma.DbNull,
      },
    });

    await prisma.farm.update({
      where: { id: demoFarmRow.id },
      data: {
        lastValidationId: validation.id,
        lastValidationStatus: validationStatus,
        lastValidationHash: evidenceHash,
        lastValidatedAt: validation.validatedAt,
      },
    });
  }

  console.log('Demo farms with validations:', EUDR_DEMO_CACHE.length);

  await prisma.producer.upsert({
    where: { document: '98765432100' },
    update: { name: 'Rafael Costa Oliveira', phone: '11999880002' },
    create: {
      name: 'Rafael Costa Oliveira',
      phone: '11999880002',
      document: '98765432100',
    },
  });
  console.log('Producer 2 (colega) criado.');

  const cooperative = await prisma.cooperative.upsert({
    where: { document: '12345678000199' },
    update: { slug: 'agro-centro-oeste' },
    create: {
      name: 'Cooperativa Agro Centro-Oeste',
      document: '12345678000199',
      slug: 'agro-centro-oeste',
      city: 'Rio Verde',
      state: 'GO',
    },
  });
  console.log('Cooperative:', cooperative.id);
}

function toPrismaBiome(biome: string): Biome {
  if (biome.includes('Amaz')) return Biome.AMAZON;
  if (biome.includes('Mata')) return Biome.ATLANTIC_FOREST;
  return Biome.CERRADO;
}

function toPrismaValidationStatus(status: string): ValidationStatus {
  if (status === 'COMPLIANT') return ValidationStatus.COMPLIANT;
  if (status === 'NON_COMPLIANT') return ValidationStatus.NON_COMPLIANT;
  return ValidationStatus.NEEDS_REVIEW;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
