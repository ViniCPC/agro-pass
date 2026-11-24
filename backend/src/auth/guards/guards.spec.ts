import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../../generated/prisma/enums';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

const SECRET = 'guard-test-secret';

function contextFor(
  request: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
) {
  const handler = () => undefined;
  for (const [key, value] of Object.entries(metadata)) {
    Reflect.defineMetadata(key, value, handler);
  }

  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET });
  const guard = new JwtAuthGuard(new Reflector(), jwt);

  it('libera rotas marcadas como publicas sem token', async () => {
    await expect(
      guard.canActivate(contextFor({ headers: {} }, { [IS_PUBLIC_KEY]: true })),
    ).resolves.toBe(true);
  });

  it('exige token Bearer', async () => {
    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Basic abc' } }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita token invalido, assinado com outro segredo ou expirado', async () => {
    const forged = await new JwtService({ secret: 'outro' }).signAsync({
      sub: 'u1',
    });
    const expired = await jwt.signAsync({ sub: 'u1' }, { expiresIn: -10 });

    for (const token of ['nao-e-jwt', forged, expired]) {
      await expect(
        guard.canActivate(
          contextFor({ headers: { authorization: `Bearer ${token}` } }),
        ),
      ).rejects.toThrow(UnauthorizedException);
    }
  });

  it('anexa o usuario do token valido a requisicao', async () => {
    const token = await jwt.signAsync({ sub: 'u1', role: UserRole.ADMIN });
    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${token}` },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: 'u1', role: UserRole.ADMIN });
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('libera rotas sem papel exigido', () => {
    expect(guard.canActivate(contextFor({}))).toBe(true);
  });

  it('libera usuario com um dos papeis exigidos', () => {
    const context = contextFor(
      { user: { role: UserRole.COOPERATIVE } },
      { [ROLES_KEY]: [UserRole.COOPERATIVE, UserRole.ADMIN] },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('bloqueia papel diferente ou usuario ausente', () => {
    const metadata = { [ROLES_KEY]: [UserRole.ADMIN] };

    expect(() =>
      guard.canActivate(
        contextFor({ user: { role: UserRole.PRODUCER } }, metadata),
      ),
    ).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextFor({}, metadata))).toThrow(
      ForbiddenException,
    );
  });
});
