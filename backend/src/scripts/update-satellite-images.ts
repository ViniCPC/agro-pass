/**
 * Atualiza os registros de EudrValidation das fazendas demo com URLs locais de imagens de satélite.
 *
 * Uso:
 *   1. Coloque as imagens na pasta: backend/uploads/satellite/
 *      Nomes esperados (podem ser .jpg ou .png):
 *        farm-compliant-01-before.jpg   farm-compliant-01-after.jpg
 *        farm-compliant-02-before.jpg   farm-compliant-02-after.jpg
 *        farm-compliant-03-before.jpg   farm-compliant-03-after.jpg
 *        farm-review-01-before.jpg      farm-review-01-after.jpg
 *        farm-non-compliant-01-before.jpg  farm-non-compliant-01-after.jpg
 *
 *   2. Execute: npx tsx --require dotenv/config src/scripts/update-satellite-images.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '..', '.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'satellite');

const DEMO_IMAGE_MAP: Record<string, { before: string; after: string }> = {
  'DEMO-COMPLIANT-01': {
    before: 'farm-compliant-01-before',
    after: 'farm-compliant-01-after',
  },
  'DEMO-COMPLIANT-02': {
    before: 'farm-compliant-02-before',
    after: 'farm-compliant-02-after',
  },
  'DEMO-COMPLIANT-03': {
    before: 'farm-compliant-03-before',
    after: 'farm-compliant-03-after',
  },
  'DEMO-REVIEW-01': {
    before: 'farm-review-01-before',
    after: 'farm-review-01-after',
  },
  'DEMO-NON-COMPLIANT-01': {
    before: 'farm-non-compliant-01-before',
    after: 'farm-non-compliant-01-after',
  },
};

function resolveImageUrl(baseName: string): string | null {
  for (const ext of ['jpg', 'png', 'jpeg', 'webp']) {
    const fileName = `${baseName}.${ext}`;
    if (existsSync(join(UPLOAD_DIR, fileName))) {
      return `/uploads/satellite/${fileName}`;
    }
  }
  return null;
}

async function main() {
  const farms = await prisma.farm.findMany({
    where: { demoCode: { not: null } },
    select: { id: true, demoCode: true, lastValidationId: true },
  });

  console.log(`Encontradas ${farms.length} fazendas demo.\n`);

  for (const farm of farms) {
    const code = farm.demoCode!;
    const imageMap = DEMO_IMAGE_MAP[code];

    if (!imageMap) {
      console.log(`[SKIP] ${code} — sem mapeamento de imagem`);
      continue;
    }

    const beforeUrl = resolveImageUrl(imageMap.before);
    const afterUrl = resolveImageUrl(imageMap.after);

    if (!beforeUrl && !afterUrl) {
      console.log(`[SKIP] ${code} — nenhum arquivo encontrado em uploads/satellite/`);
      continue;
    }

    if (!farm.lastValidationId) {
      console.log(`[SKIP] ${code} — sem lastValidationId (rode npm run seed primeiro)`);
      continue;
    }

    await prisma.eudrValidation.update({
      where: { id: farm.lastValidationId },
      data: {
        satelliteImageBeforeUrl: beforeUrl,
        satelliteImageAfterUrl: afterUrl,
      },
    });

    console.log(`[OK] ${code}`);
    console.log(`     before → ${beforeUrl ?? 'NÃO ENCONTRADO'}`);
    console.log(`     after  → ${afterUrl ?? 'NÃO ENCONTRADO'}\n`);
  }

  console.log('Concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
