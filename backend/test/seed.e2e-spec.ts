import { execFileSync } from 'node:child_process';
import { PrismaService } from '../src/prisma/prisma.service';
import { EventChainService } from '../src/event-chain/event-chain.service';
import { EventHashService } from '../src/trace-events/event-hash.service';

describe('Seed de demonstracao (e2e)', () => {
  const prisma = new PrismaService();
  const chain = new EventChainService(prisma, new EventHashService());

  beforeAll(() => prisma.$connect());
  afterAll(() => prisma.$disconnect());

  function seed() {
    execFileSync(process.execPath, ['--import', 'tsx', 'prisma/seed.ts'], {
      env: { ...process.env, NODE_ENV: 'test', DEMO_PASSWORD: 'AgroPass@2026' },
      stdio: 'pipe',
      timeout: 30_000,
    });
  }

  async function snapshot() {
    return {
      users: await prisma.user.findMany({
        where: { email: { endsWith: '@agropass.local' } },
        orderBy: { id: 'asc' },
      }),
      batches: await prisma.batch.findMany({
        where: { code: { in: ['AGP-2026-0001', 'AGP-2026-0002'] } },
        orderBy: { code: 'asc' },
        include: { traceEvents: { orderBy: { sequence: 'asc' } } },
      }),
    };
  }

  it('preserva dados e senhas na repeticao e cria cadeias verificaveis', async () => {
    seed();
    const before = await snapshot();
    expect(before.users).toHaveLength(4);
    expect(before.batches).toHaveLength(2);
    seed();
    expect(await snapshot()).toEqual(before);
    for (const batch of before.batches) {
      expect(await chain.verify(batch.id)).toMatchObject({ valid: true });
    }
    expect(before.batches[1].traceEvents).toHaveLength(7);
    expect(before.batches[1].status).toBe('CLOSED');
  }, 60_000);
});
