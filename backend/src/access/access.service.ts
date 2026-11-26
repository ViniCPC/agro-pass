import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { BatchStatus, UserRole } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

// Matches no row. Used when an account lacks the link its role needs, so a
// missing id never turns into "no filter".
const NOTHING = { id: { in: [] as string[] } };

// Operators move batches between the cooperative and the buyer: they see a
// batch once a cooperative has received it, never before.
export const OPERATOR_VISIBLE_STATUSES: BatchStatus[] = [
  BatchStatus.RECEIVED,
  BatchStatus.IN_TRANSIT,
  BatchStatus.PROCESSED,
  BatchStatus.DELIVERED,
  BatchStatus.CLOSED,
];

// What each role may see and change. Every authenticated read of farms,
// batches, producers and their events/documents goes through these filters;
// an id outside them answers 404, as if it did not exist.
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  // Demo accounts only see records of their visit; real accounts never see
  // demo records. Applied on top of the role rules below.
  private tenant(user: AuthUser): Prisma.ProducerWhereInput {
    return { demoSessionId: user.demoSessionId ?? null };
  }

  producerWhere(user: AuthUser): Prisma.ProducerWhereInput {
    return { AND: [this.tenant(user), this.producerRole(user)] };
  }

  farmWhere(user: AuthUser): Prisma.FarmWhereInput {
    return { AND: [{ producer: this.tenant(user) }, this.farmRole(user)] };
  }

  batchWhere(user: AuthUser): Prisma.BatchWhereInput {
    return {
      AND: [{ farm: { producer: this.tenant(user) } }, this.batchRole(user)],
    };
  }

  private producerRole(user: AuthUser): Prisma.ProducerWhereInput {
    switch (user.role) {
      case UserRole.ADMIN:
        return {};
      case UserRole.PRODUCER:
        return user.producerId ? { id: user.producerId } : NOTHING;
      case UserRole.COOPERATIVE:
        return user.cooperativeId
          ? { cooperativeId: user.cooperativeId }
          : NOTHING;
      default:
        return NOTHING;
    }
  }

  private farmRole(user: AuthUser): Prisma.FarmWhereInput {
    switch (user.role) {
      case UserRole.ADMIN:
        return {};
      case UserRole.PRODUCER:
        return user.producerId ? { producerId: user.producerId } : NOTHING;
      case UserRole.COOPERATIVE:
        return user.cooperativeId
          ? { producer: { cooperativeId: user.cooperativeId } }
          : NOTHING;
      case UserRole.OPERATOR:
        return {
          batches: { some: { status: { in: OPERATOR_VISIBLE_STATUSES } } },
        };
      default:
        return NOTHING;
    }
  }

  private batchRole(user: AuthUser): Prisma.BatchWhereInput {
    switch (user.role) {
      case UserRole.ADMIN:
        return {};
      case UserRole.PRODUCER:
        return user.producerId
          ? { farm: { producerId: user.producerId } }
          : NOTHING;
      case UserRole.COOPERATIVE:
        return user.cooperativeId
          ? { farm: { producer: { cooperativeId: user.cooperativeId } } }
          : NOTHING;
      case UserRole.OPERATOR:
        return { status: { in: OPERATOR_VISIBLE_STATUSES } };
      default:
        return NOTHING;
    }
  }

  async assertBatch(id: string, user: AuthUser): Promise<void> {
    const batch = await this.prisma.batch.findFirst({
      where: { AND: [{ id }, this.batchWhere(user)] },
      select: { id: true },
    });
    if (!batch) throw new NotFoundException('Lote nao encontrado.');
  }

  async assertFarm(id: string, user: AuthUser): Promise<void> {
    const farm = await this.prisma.farm.findFirst({
      where: { AND: [{ id }, this.farmWhere(user)] },
      select: { id: true },
    });
    if (!farm) throw new NotFoundException('Fazenda nao encontrada.');
  }

  async assertProducer(id: string, user: AuthUser): Promise<void> {
    const producer = await this.prisma.producer.findFirst({
      where: { AND: [{ id }, this.producerWhere(user)] },
      select: { id: true },
    });
    if (!producer) throw new NotFoundException('Produtor nao encontrado.');
  }
}
