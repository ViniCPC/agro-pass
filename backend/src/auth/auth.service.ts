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
import { SignupDto } from './dto/signup.dto';

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  producerId: true,
  cooperativeId: true,
  demoSessionId: true,
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
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_PUBLIC_REGISTRATION !== 'true'
    ) {
      throw new ForbiddenException(
        'Cadastro publico desabilitado neste ambiente.',
      );
    }
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
            dto.role === UserRole.COOPERATIVE ? dto.cooperativeId : undefined,
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

  // Open in every environment: it can only create a producer account, linked
  // to a new producer record, never another role or someone else's record.
  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    let cooperativeId: string | undefined;
    if (dto.inviteCode) {
      const cooperative = await this.prisma.cooperative.findUnique({
        where: { inviteCode: dto.inviteCode },
        select: { id: true },
      });
      if (!cooperative) {
        throw new BadRequestException(
          'Código de convite não encontrado. Confira com a sua cooperativa.',
        );
      }
      cooperativeId = cooperative.id;
    }

    const [emailTaken, documentTaken, phoneTaken] = await Promise.all([
      this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
      this.prisma.producer.findUnique({
        where: { document: dto.document },
        select: { id: true },
      }),
      this.prisma.producer.findUnique({
        where: { phone: dto.phone },
        select: { id: true },
      }),
    ]);
    if (emailTaken) {
      throw new ConflictException(
        'Este email já tem uma conta. Entre com ele.',
      );
    }
    if (documentTaken) {
      throw new ConflictException(
        'Já existe um produtor com este CPF/CNPJ. Fale com o suporte.',
      );
    }
    if (phoneTaken) {
      throw new ConflictException('Este telefone já está em outro cadastro.');
    }

    const passwordHash = await hash(dto.password, 10);

    try {
      // One write: the user and its producer record exist together or not at all.
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: UserRole.PRODUCER,
          producer: {
            create: {
              name,
              phone: dto.phone,
              document: dto.document,
              cooperativeId,
            },
          },
        },
        select: SAFE_USER_SELECT,
      });

      return this.buildAuthResponse(user);
    } catch (error) {
      // A concurrent sign-up with the same data.
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Email, CPF/CNPJ ou telefone já cadastrado.',
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

  async buildAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    producerId: string | null;
    cooperativeId: string | null;
    demoSessionId?: string | null;
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
      demoSessionId: user.demoSessionId ?? null,
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
        demoSessionId: user.demoSessionId ?? null,
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
