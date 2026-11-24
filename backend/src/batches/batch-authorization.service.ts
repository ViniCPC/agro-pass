import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  BatchStatus,
  TraceEventType,
  UserRole,
} from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';

type OwnedBatch = {
  farm: {
    producerId: string;
    producer: { cooperativeId: string | null };
  };
};

const STATUS_ROLE: Partial<Record<BatchStatus, UserRole>> = {
  [BatchStatus.HARVESTED]: UserRole.PRODUCER,
  [BatchStatus.RECEIVED]: UserRole.COOPERATIVE,
  [BatchStatus.IN_TRANSIT]: UserRole.OPERATOR,
  [BatchStatus.PROCESSED]: UserRole.COOPERATIVE,
  [BatchStatus.DELIVERED]: UserRole.OPERATOR,
  [BatchStatus.CLOSED]: UserRole.ADMIN,
  [BatchStatus.CANCELLED]: UserRole.ADMIN,
};

@Injectable()
export class BatchAuthorizationService {
  assertCanCreate(farmProducerId: string, user: AuthUser): void {
    if (user.role === UserRole.ADMIN) return;

    if (
      user.role !== UserRole.PRODUCER ||
      !user.producerId ||
      user.producerId !== farmProducerId
    ) {
      throw new ForbiddenException(
        'Produtor so pode criar lotes em propriedades vinculadas a sua conta.',
      );
    }
  }

  assertCanTransition(
    batch: OwnedBatch,
    nextStatus: BatchStatus,
    user: AuthUser,
  ): void {
    if (user.role === UserRole.ADMIN) return;

    const requiredRole = STATUS_ROLE[nextStatus];
    if (!requiredRole || user.role !== requiredRole) {
      throw new ForbiddenException(
        `Papel ${user.role} nao pode registrar a etapa ${nextStatus}.`,
      );
    }

    this.assertOwnership(batch, user);
  }

  assertCanAddEvent(
    batch: OwnedBatch,
    type: TraceEventType,
    user: AuthUser,
  ): void {
    if (type !== TraceEventType.CORRECTION) {
      throw new ForbiddenException(
        'Este tipo de evento e registrado automaticamente pelo sistema.',
      );
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Somente administradores podem registrar correcoes auditaveis.',
      );
    }
  }

  assertCanManageDocuments(batch: OwnedBatch, user: AuthUser): void {
    if (user.role === UserRole.ADMIN) return;

    if (
      user.role !== UserRole.COOPERATIVE ||
      !user.cooperativeId ||
      user.cooperativeId !== batch.farm.producer.cooperativeId
    ) {
      throw new ForbiddenException(
        'Cooperativa nao pode alterar documentos deste lote.',
      );
    }
  }

  private assertOwnership(batch: OwnedBatch, user: AuthUser): void {
    if (
      user.role === UserRole.PRODUCER &&
      user.producerId !== batch.farm.producerId
    ) {
      throw new ForbiddenException('Lote nao pertence a este produtor.');
    }

    if (
      user.role === UserRole.COOPERATIVE &&
      user.cooperativeId !== batch.farm.producer.cooperativeId
    ) {
      throw new ForbiddenException(
        'Lote nao pertence a um produtor desta cooperativa.',
      );
    }
  }
}
