import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchCodeService } from './batch-code.service';
import { BatchDto } from './dto/batch.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { ListBatchesResponseDto } from './dto/list-batches-response.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';

const MAX_CODE_GENERATION_ATTEMPTS = 3;

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchCodeService: BatchCodeService,
  ) {}

  async create(dto: CreateBatchDto): Promise<BatchDto> {
    await this.findFarmOrThrow(dto.farmId);

    const harvestDate = dto.harvestDate ? new Date(dto.harvestDate) : undefined;

    for (let attempt = 1; attempt <= MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const code = await this.batchCodeService.generate(
        dto.productType,
        harvestDate,
      );

      try {
        const batch = await this.prisma.batch.create({
          data: {
            code,
            productType: dto.productType,
            quantity: dto.quantity,
            unit: dto.unit.trim(),
            harvestDate: harvestDate ?? null,
            farmId: dto.farmId,
          },
          include: { farm: true },
        });

        return BatchDto.fromModel(batch);
      } catch (error) {
        if (
          attempt < MAX_CODE_GENERATION_ATTEMPTS &&
          this.isUniqueConstraintError(error)
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Nao foi possivel gerar um codigo unico para o lote.',
    );
  }

  async findAll(page: number, limit: number): Promise<ListBatchesResponseDto> {
    const skip = (page - 1) * limit;

    const [batches, totalItems] = await this.prisma.$transaction([
      this.prisma.batch.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { farm: true },
      }),
      this.prisma.batch.count(),
    ]);

    return {
      data: batches.map((batch) => BatchDto.fromModel(batch)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async findOne(id: string): Promise<BatchDto> {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: { farm: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    return BatchDto.fromModel(batch);
  }

  async updateStatus(id: string, dto: UpdateBatchStatusDto): Promise<BatchDto> {
    await this.findBatchOrThrow(id);

    const updated = await this.prisma.batch.update({
      where: { id },
      data: { status: dto.status },
      include: { farm: true },
    });

    return BatchDto.fromModel(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findBatchOrThrow(id);
    await this.prisma.batch.delete({ where: { id } });
  }

  private async findFarmOrThrow(farmId: string): Promise<void> {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: { id: true },
    });

    if (!farm) {
      throw new NotFoundException('Fazenda nao encontrada.');
    }
  }

  private async findBatchOrThrow(id: string): Promise<void> {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
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
