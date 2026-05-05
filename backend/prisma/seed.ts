import { PrismaPg } from '@prisma/adapter-pg';
import {
  Biome,
  FarmStatus,
  PrismaClient,
  ValidationStatus,
} from '../generated/prisma/client';
import { EUDR_DEMO_CACHE } from '../src/eudr/demo/eudr-demo-cache';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const producer = await prisma.producer.upsert({
    where: { document: '12345678901' },
    update: {},
    create: {
      name: 'João da Silva',
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
    const status =
      demoFarm.status === 'COMPLIANT'
        ? FarmStatus.APPROVED
        : demoFarm.status === 'NON_COMPLIANT'
          ? FarmStatus.REJECTED
          : FarmStatus.PENDING;
    const validationStatus = toPrismaValidationStatus(demoFarm.status);
    const validationHash = `demo-eudr-${demoFarm.farmCode}`;

    await prisma.farm.upsert({
      where: { carNumber: `DEMO-CAR-${demoFarm.farmCode}` },
      update: {
        demoCode: demoFarm.farmCode,
        totalAreaHa: demoFarm.totalAreaHa,
        status,
        lastValidationStatus: validationStatus,
        lastValidationHash: validationHash,
        lastValidatedAt: new Date(),
      },
      create: {
        name: `Fazenda ${demoFarm.farmCode}`,
        city: coords.city,
        state: coords.state,
        latitude: coords.latitude,
        longitude: coords.longitude,
        carNumber: `DEMO-CAR-${demoFarm.farmCode}`,
        demoCode: demoFarm.farmCode,
        totalAreaHa: demoFarm.totalAreaHa,
        biome: toPrismaBiome(demoFarm.biome),
        status,
        lastValidationStatus: validationStatus,
        lastValidationHash: validationHash,
        lastValidatedAt: new Date(),
        producerId: producer.id,
      },
    });
  }

  console.log('Demo farms:', EUDR_DEMO_CACHE.length);

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
