import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "TraceEvent", "Document", "Batch", "Farm", "User", "Producer", "Cooperative", "Exporter" RESTART IDENTITY CASCADE',
  );
  console.log('Banco de dados limpo com sucesso.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
