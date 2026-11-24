import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

function safeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-uuid',
    name: 'Produtor Teste',
    email: 'produtor@example.com',
    role: UserRole.PRODUCER,
    producerId: 'producer-uuid',
    cooperativeId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let userCreate: jest.Mock;
  let userFindUnique: jest.Mock;
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    userCreate = jest.fn();
    userFindUnique = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: { create: userCreate, findUnique: userFindUnique },
            producer: {
              findUnique: jest.fn().mockResolvedValue({ id: 'producer-uuid' }),
            },
            cooperative: { findUnique: jest.fn() },
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-jwt') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('desabilita cadastro livre em producao por padrao', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_PUBLIC_REGISTRATION;
    await expect(
      service.register({
        name: 'Produtor',
        email: 'produtor@example.com',
        password: 'senha-segura',
        role: UserRole.PRODUCER,
        producerId: 'producer-uuid',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(userCreate).not.toHaveBeenCalled();
  });

  it('armazena hash e nunca retorna senha no cadastro', async () => {
    let storedPassword = '';
    userCreate.mockImplementation(
      ({ data }: { data: { passwordHash: string } }) => {
        storedPassword = data.passwordHash;
        return safeUser();
      },
    );

    const result = await service.register({
      name: 'Produtor Teste',
      email: 'PRODUTOR@example.com',
      password: 'senha-segura',
      role: UserRole.PRODUCER,
      producerId: 'producer-uuid',
    });

    expect(storedPassword).not.toBe('senha-segura');
    expect(storedPassword).toMatch(/^\$2[aby]\$/);
    expect(result).toMatchObject({ accessToken: 'signed-jwt' });
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('retorna conflito para email ou vinculo duplicado', async () => {
    userCreate.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.register({
        name: 'Produtor',
        email: 'produtor@example.com',
        password: 'senha-segura',
        role: UserRole.PRODUCER,
        producerId: 'producer-uuid',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('faz login com senha valida sem expor o hash', async () => {
    userFindUnique.mockResolvedValue({
      ...safeUser(),
      passwordHash: await hash('senha-segura', 4),
    });

    const result = await service.login({
      email: 'produtor@example.com',
      password: 'senha-segura',
    });

    expect(result.accessToken).toBe('signed-jwt');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejeita credenciais invalidas', async () => {
    userFindUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'x@example.com', password: 'errada' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
