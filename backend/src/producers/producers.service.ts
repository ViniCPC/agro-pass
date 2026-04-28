import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { ListProducersResponseDto } from './dto/list-producers-response.dto';
import { ProducerDto } from './dto/producer.dto';

@Injectable()
export class ProducersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProducerDto: CreateProducerDto): Promise<ProducerDto> {
    const name = createProducerDto.name.trim();
    const phone = createProducerDto.phone.trim();
    const document = createProducerDto.document?.trim() || null;

    try {
      const producer = await this.prisma.producer.create({
        data: { name, phone, document },
      });
      return ProducerDto.fromModel(producer);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Já existe um produtor com este documento.');
      }
      throw e;
    }
  }

  async findAll(page: number, limit: number): Promise<ListProducersResponseDto> {
    const skip = (page - 1) * limit;

    const [producers, totalItems] = await this.prisma.$transaction([
      this.prisma.producer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.producer.count(),
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
