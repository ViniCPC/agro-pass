import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { ListProducersResponseDto } from './dto/list-producers-response.dto';
import { ProducerDto } from './dto/producer.dto';

@Injectable()
export class ProducersService {
  constructor(private readonly prisma: PrismaService) {}

  // A producer registered by a cooperative is linked to it, so it can see the
  // producer afterwards and record the stages of its batches.
  async create(
    createProducerDto: CreateProducerDto,
    cooperativeId: string | null = null,
    demoSessionId: string | null = null,
  ): Promise<ProducerDto> {
    const name = createProducerDto.name.trim();
    const phone = createProducerDto.phone.trim();
    const document = createProducerDto.document.trim();

    try {
      const producer = await this.prisma.producer.create({
        data: { name, phone, document, cooperativeId, demoSessionId },
      });
      return ProducerDto.fromModel(producer);
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um produtor com este documento.',
        );
      }
      throw e;
    }
  }

  async findAll(
    page: number,
    limit: number,
    where: Prisma.ProducerWhereInput = {},
  ): Promise<ListProducersResponseDto> {
    const skip = (page - 1) * limit;

    const [producers, totalItems] = await this.prisma.$transaction([
      this.prisma.producer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.producer.count({ where }),
    ]);

    return {
      data: producers.map((producer) => ProducerDto.fromModel(producer)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async findOne(id: string): Promise<ProducerDto> {
    const producer = await this.prisma.producer.findUnique({
      where: { id },
    });

    if (!producer) {
      throw new NotFoundException('Produtor não encontrado.');
    }

    return ProducerDto.fromModel(producer);
  }
}
