import { BadRequestException } from '@nestjs/common';
import { BatchStatus } from '../../generated/prisma/enums';
import { BatchLifecycleService } from './batch-lifecycle.service';

describe('BatchLifecycleService', () => {
  const service = new BatchLifecycleService();

  it.each([
    [BatchStatus.CREATED, BatchStatus.HARVESTED],
    [BatchStatus.HARVESTED, BatchStatus.RECEIVED],
    [BatchStatus.RECEIVED, BatchStatus.IN_TRANSIT],
    [BatchStatus.IN_TRANSIT, BatchStatus.PROCESSED],
    [BatchStatus.PROCESSED, BatchStatus.DELIVERED],
    [BatchStatus.DELIVERED, BatchStatus.CLOSED],
  ])('permite a transicao %s -> %s', (current, next) => {
    expect(service.canTransition(current, next)).toBe(true);
    expect(() => service.assertCanTransition(current, next)).not.toThrow();
  });

  it.each([
    BatchStatus.CREATED,
    BatchStatus.HARVESTED,
    BatchStatus.RECEIVED,
    BatchStatus.IN_TRANSIT,
    BatchStatus.PROCESSED,
    BatchStatus.DELIVERED,
  ])('permite cancelar um lote ativo em %s', (status) => {
    expect(service.canTransition(status, BatchStatus.CANCELLED)).toBe(true);
  });

  it.each([
    [BatchStatus.CREATED, BatchStatus.DELIVERED],
    [BatchStatus.HARVESTED, BatchStatus.PROCESSED],
    [BatchStatus.CLOSED, BatchStatus.IN_TRANSIT],
    [BatchStatus.CANCELLED, BatchStatus.HARVESTED],
  ])('rejeita a transicao %s -> %s', (current, next) => {
    expect(() => service.assertCanTransition(current, next)).toThrow(
      BadRequestException,
    );
  });

  it.each([BatchStatus.CLOSED, BatchStatus.CANCELLED])(
    'considera %s imutavel',
    (status) => {
      expect(() => service.assertMutable(status)).toThrow(BadRequestException);
      expect(service.getAllowedTransitions(status)).toEqual([]);
    },
  );
});
