import { ForbiddenException } from '@nestjs/common';
import {
  BatchStatus,
  TraceEventType,
  UserRole,
} from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { BatchAuthorizationService } from './batch-authorization.service';

const batch = {
  farm: {
    producerId: 'producer-1',
    producer: { cooperativeId: 'cooperative-1' },
  },
};

function user(role: UserRole, overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    sub: `${role.toLowerCase()}-user`,
    name: role,
    email: `${role.toLowerCase()}@example.com`,
    role,
    producerId: role === UserRole.PRODUCER ? 'producer-1' : null,
    cooperativeId: role === UserRole.COOPERATIVE ? 'cooperative-1' : null,
    ...overrides,
  };
}

describe('BatchAuthorizationService', () => {
  const service = new BatchAuthorizationService();

  it('permite produtor criar lote somente na propria propriedade', () => {
    expect(() =>
      service.assertCanCreate('producer-1', user(UserRole.PRODUCER)),
    ).not.toThrow();
    expect(() =>
      service.assertCanCreate('producer-2', user(UserRole.PRODUCER)),
    ).toThrow(ForbiddenException);
  });

  it.each([
    [BatchStatus.HARVESTED, UserRole.PRODUCER],
    [BatchStatus.RECEIVED, UserRole.COOPERATIVE],
    [BatchStatus.IN_TRANSIT, UserRole.OPERATOR],
    [BatchStatus.PROCESSED, UserRole.COOPERATIVE],
    [BatchStatus.DELIVERED, UserRole.OPERATOR],
    [BatchStatus.CLOSED, UserRole.ADMIN],
    [BatchStatus.CANCELLED, UserRole.ADMIN],
  ])('permite %s para o papel %s', (status, role) => {
    expect(() =>
      service.assertCanTransition(batch, status, user(role)),
    ).not.toThrow();
  });

  it('rejeita papel incorreto', () => {
    expect(() =>
      service.assertCanTransition(
        batch,
        BatchStatus.RECEIVED,
        user(UserRole.OPERATOR),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejeita produtor e cooperativa sem propriedade do lote', () => {
    expect(() =>
      service.assertCanTransition(
        batch,
        BatchStatus.HARVESTED,
        user(UserRole.PRODUCER, { producerId: 'producer-2' }),
      ),
    ).toThrow(ForbiddenException);

    expect(() =>
      service.assertCanTransition(
        batch,
        BatchStatus.RECEIVED,
        user(UserRole.COOPERATIVE, { cooperativeId: 'cooperative-2' }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('impede criacao manual de eventos do sistema', () => {
    expect(() =>
      service.assertCanAddEvent(
        batch,
        TraceEventType.CREATED,
        user(UserRole.ADMIN),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      service.assertCanAddEvent(
        batch,
        TraceEventType.MINTED_ONCHAIN,
        user(UserRole.ADMIN),
      ),
    ).toThrow(ForbiddenException);
  });

  it('permite correcao auditavel somente para administrador', () => {
    expect(() =>
      service.assertCanAddEvent(
        batch,
        TraceEventType.CORRECTION,
        user(UserRole.ADMIN),
      ),
    ).not.toThrow();
    expect(() =>
      service.assertCanAddEvent(
        batch,
        TraceEventType.CORRECTION,
        user(UserRole.PRODUCER),
      ),
    ).toThrow(ForbiddenException);
  });
});
