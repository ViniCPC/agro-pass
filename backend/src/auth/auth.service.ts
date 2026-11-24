import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './auth-user.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  producerId: true,
  cooperativeId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    await this.validateAssociation(dto);

    const email = dto.email.trim().toLowerCase();
    const passwordHash = await hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          passwordHash,
          role: dto.role,
          producerId:
            dto.role === UserRole.PRODUCER ? dto.producerId : undefined,
          cooperativeId:
            dto.role === UserRole.COOPERATIVE
              ? dto.cooperativeId
              : undefined,
        },
        select: SAFE_USER_SELECT,
      });

      return this.buildAuthResponse(user);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Email ou vinculo de usuario ja cadastrado.',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou senha invalidos.');
    }

    return this.buildAuthResponse(user);
  }

  async me(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('Usuario do token nao existe mais.');
    }

    return user;
  }

  private async buildAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    producerId: string | null;
    cooperativeId: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const payload: AuthUser = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      producerId: user.producerId,
      cooperativeId: user.cooperativeId,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        producerId: user.producerId,
        cooperativeId: user.cooperativeId,
        ...(user.createdAt ? { createdAt: user.createdAt } : {}),
        ...(user.updatedAt ? { updatedAt: user.updatedAt } : {}),
      },
    };
  }

  private async validateAssociation(dto: RegisterDto): Promise<void> {
    if (dto.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Administradores nao podem ser criados pelo cadastro publico.',
      );
    }

    if (dto.role === UserRole.PRODUCER) {
      if (!dto.producerId || dto.cooperativeId) {
        throw new BadRequestException(
          'Usuario produtor deve informar somente producerId.',
        );
      }

      const producer = await this.prisma.producer.findUnique({
        where: { id: dto.producerId },
        select: { id: true },
      });
      if (!producer) {
        throw new BadRequestException('Produtor informado nao existe.');
      }
      return;
    }

    if (dto.role === UserRole.COOPERATIVE) {
      if (!dto.cooperativeId || dto.producerId) {
        throw new BadRequestException(
          'Usuario cooperativa deve informar somente cooperativeId.',
        );
      }

      const cooperative = await this.prisma.cooperative.findUnique({
        where: { id: dto.cooperativeId },
        select: { id: true },
      });
      if (!cooperative) {
        throw new BadRequestException('Cooperativa informada nao existe.');
      }
      return;
    }

    if (dto.producerId || dto.cooperativeId) {
      throw new BadRequestException(
        'Usuario operador nao pode possuir vinculo de produtor ou cooperativa.',
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
