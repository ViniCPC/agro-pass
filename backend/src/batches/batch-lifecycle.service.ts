import { BadRequestException, Injectable } from '@nestjs/common';
import { BatchStatus } from '../../generated/prisma/enums';

const FORWARD_TRANSITION: Partial<Record<BatchStatus, BatchStatus>> = {
  [BatchStatus.CREATED]: BatchStatus.HARVESTED,
  [BatchStatus.HARVESTED]: BatchStatus.RECEIVED,
  [BatchStatus.RECEIVED]: BatchStatus.IN_TRANSIT,
  [BatchStatus.IN_TRANSIT]: BatchStatus.PROCESSED,
  [BatchStatus.PROCESSED]: BatchStatus.DELIVERED,
  [BatchStatus.DELIVERED]: BatchStatus.CLOSED,
};

const TERMINAL_STATUSES = new Set<BatchStatus>([
  BatchStatus.CLOSED,
  BatchStatus.CANCELLED,
]);

@Injectable()
export class BatchLifecycleService {
  getAllowedTransitions(currentStatus: BatchStatus): BatchStatus[] {
    if (TERMINAL_STATUSES.has(currentStatus)) {
      return [];
    }

    const forward = FORWARD_TRANSITION[currentStatus];
    return forward ? [forward, BatchStatus.CANCELLED] : [BatchStatus.CANCELLED];
  }

  canTransition(currentStatus: BatchStatus, nextStatus: BatchStatus): boolean {
    return this.getAllowedTransitions(currentStatus).includes(nextStatus);
  }

  assertCanTransition(
    currentStatus: BatchStatus,
    nextStatus: BatchStatus,
  ): void {
    if (!this.canTransition(currentStatus, nextStatus)) {
      throw new BadRequestException(
        `Transicao de ${currentStatus} para ${nextStatus} nao permitida.`,
      );
    }
  }

  assertMutable(status: BatchStatus): void {
    if (TERMINAL_STATUSES.has(status)) {
      throw new BadRequestException(
        `Lote com status ${status} nao pode receber alteracoes.`,
      );
    }
  }
}
