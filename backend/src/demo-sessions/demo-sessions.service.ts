import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UserRole } from '../../generated/prisma/enums';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { FILE_STORAGE, type FileStorage } from '../storage/file-storage';

function readPositive(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SESSION_TTL_MS =
  readPositive(process.env.DEMO_SESSION_TTL_HOURS, 24) * 60 * 60 * 1000;
// Upper bound on live visits, whatever the per-IP limit lets through.
const MAX_ACTIVE_SESSIONS = readPositive(
  process.env.DEMO_MAX_ACTIVE_SESSIONS,
  200,
);
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const CLEANUP_BATCH = 50;

const ROLE_NAMES: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador (demo)',
  [UserRole.PRODUCER]: 'Produtor (demo)',
  [UserRole.COOPERATIVE]: 'Cooperativa (demo)',
  [UserRole.OPERATOR]: 'Operador logístico (demo)',
};

type AuthResponse = Awaited<ReturnType<AuthService['buildAuthResponse']>>;

export interface DemoSessionResponse {
  expiresAt: Date;
  // One signed-in account per role; the client switches between them.
  accounts: Record<UserRole, AuthResponse>;
}

@Injectable()
export class DemoSessionsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DemoSessionsService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.cleanupExpired().catch((error: unknown) =>
        this.logger.error(`Limpeza da demo falhou: ${String(error)}`),
      );
    }, CLEANUP_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  // A visit of its own: a cooperative, a producer of it with one farm, and an
  // account per role, all tied to the session and invisible to anyone else.
  async create(now = new Date()): Promise<DemoSessionResponse> {
    await this.cleanupExpired(now);
    const active = await this.prisma.demoSession.count({
      where: { expiresAt: { gt: now } },
    });
    if (active >= MAX_ACTIVE_SESSIONS) {
      throw new ServiceUnavailableException(
        'Muitas demonstracoes abertas agora. Tente de novo em alguns minutos.',
      );
    }

    // Demo accounts sign in only with the tokens returned here.
    const passwordHash = await hash(randomBytes(32).toString('hex'), 4);

    const users = await this.prisma.$transaction(async (tx) => {
      const session = await tx.demoSession.create({
        data: { expiresAt: new Date(now.getTime() + SESSION_TTL_MS) },
      });
      const tag = session.id;
      const demoSessionId = session.id;

      const cooperative = await tx.cooperative.create({
        data: {
          name: 'Cooperativa Demonstração',
          document: `demo-${tag}`,
          city: 'Patrocínio',
          state: 'MG',
          demoSessionId,
        },
      });
      const producer = await tx.producer.create({
        data: {
          name: 'Produtor Demonstração',
          phone: `demo-${tag}`,
          document: `demo-${tag}`,
          cooperativeId: cooperative.id,
          demoSessionId,
        },
      });
      // Ready to create the first batch right away.
      await tx.farm.create({
        data: {
          name: 'Fazenda Boa Vista',
          city: 'Patrocínio',
          state: 'MG',
          latitude: -18.9438,
          longitude: -46.9925,
          totalAreaHa: 120,
          producerId: producer.id,
        },
      });

      const roles = [
        UserRole.ADMIN,
        UserRole.PRODUCER,
        UserRole.COOPERATIVE,
        UserRole.OPERATOR,
      ];
      return Promise.all(
        roles.map((role) =>
          tx.user.create({
            data: {
              name: ROLE_NAMES[role],
              email: `${role.toLowerCase()}.${tag}@demo.agropass.local`,
              passwordHash,
              role,
              producerId: role === UserRole.PRODUCER ? producer.id : null,
              cooperativeId:
                role === UserRole.COOPERATIVE ? cooperative.id : null,
              demoSessionId,
            },
          }),
        ),
      ).then((created) => ({ created, expiresAt: session.expiresAt }));
    });

    const accounts = {} as Record<UserRole, AuthResponse>;
    for (const user of users.created) {
      accounts[user.role] = await this.auth.buildAuthResponse(user);
    }
    return { expiresAt: users.expiresAt, accounts };
  }

  // Deletes expired visits with everything they created, files included.
  async cleanupExpired(now = new Date()): Promise<number> {
    const sessions = await this.prisma.demoSession.findMany({
      where: { expiresAt: { lte: now } },
      select: { id: true },
      take: CLEANUP_BATCH,
    });
    let removed = 0;
    for (const { id } of sessions) {
      const keys = await this.deleteSession(id);
      removed += 1;
      await Promise.all(
        keys.map((key) =>
          this.storage
            .delete(key)
            .catch((error: unknown) =>
              this.logger.warn(`Arquivo ${key} nao removido: ${String(error)}`),
            ),
        ),
      );
    }
    if (removed > 0)
      this.logger.log(`${removed} demonstracao(oes) removida(s)`);
    return removed;
  }

  private async deleteSession(demoSessionId: string): Promise<string[]> {
    return this.prisma.$transaction(async (tx) => {
      const farms = await tx.farm.findMany({
        where: { producer: { demoSessionId } },
        select: { id: true },
      });
      const farmIds = farms.map((farm) => farm.id);
      const batches = await tx.batch.findMany({
        where: { farmId: { in: farmIds } },
        select: { id: true },
      });
      const batchIds = batches.map((batch) => batch.id);
      const documentScope = {
        OR: [{ batchId: { in: batchIds } }, { farmId: { in: farmIds } }],
      };
      const documents = await tx.document.findMany({
        where: documentScope,
        select: { storageKey: true },
      });

      // Events and corrections restrict deletes: unlink, then remove bottom-up.
      await tx.traceEvent.updateMany({
        where: { batchId: { in: batchIds } },
        data: { correctedEventId: null },
      });
      await tx.document.deleteMany({ where: documentScope });
      await tx.traceEvent.deleteMany({ where: { batchId: { in: batchIds } } });
      await tx.batch.deleteMany({ where: { id: { in: batchIds } } });
      await tx.farm.deleteMany({ where: { id: { in: farmIds } } });
      await tx.user.deleteMany({ where: { demoSessionId } });
      await tx.producer.deleteMany({ where: { demoSessionId } });
      await tx.cooperative.deleteMany({ where: { demoSessionId } });
      await tx.demoSession.delete({ where: { id: demoSessionId } });

      return documents.map((document) => document.storageKey);
    });
  }
}
