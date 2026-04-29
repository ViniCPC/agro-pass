import { Biome, FarmStatus, PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

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
      preservedSurplusHa: 80,
      status: FarmStatus.APPROVED,
      producerId: producer.id,
    },
  });
  console.log('Farm:', farm.id);

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
  console.log('Cooperative:', cooperative.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
