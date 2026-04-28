import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductType } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BatchDto } from './dto/batch.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { ListBatchesResponseDto } from './dto/list-batches-response.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';

const CODE_PREFIX: Record<string, string> = {
  COFFEE: 'CAF',
  SOY: 'SOY',
  CATTLE: 'CAT',
};

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(productType: ProductType, harvestDate?: Date): Promise<string> {
    const prefix = CODE_PREFIX[productType];
    const year = (harvestDate ?? new Date()).getFullYear();
    const codePrefix = `${prefix}-${year}-`;

    const lastBatch = await this.prisma.batch.findFirst({
      where: { code: { startsWith: codePrefix } },
      orderBy: { code: 'desc' },
    });

    const sequence = lastBatch ? parseInt(lastBatch.code.split('-')[2], 10) + 1 : 1;
    return `${codePrefix}${String(sequence).padStart(4, '0')}`;
  }

  async create(dto: CreateBatchDto): Promise<BatchDto> {
    const farm = await this.prisma.farm.findUnique({ where: { id: dto.farmId } });
    if (!farm) {
      throw new NotFoundException('Fazenda não encontrada.');
    }

    const harvestDate = dto.harvestDate ? new Date(dto.harvestDate) : undefined;
    const code = await this.generateCode(dto.productType, harvestDate);

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
      throw new NotFoundException('Lote não encontrado.');
    }

    return BatchDto.fromModel(batch);
  }

  async updateStatus(id: string, dto: UpdateBatchStatusDto): Promise<BatchDto> {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException('Lote não encontrado.');
    }

    const updated = await this.prisma.batch.update({
      where: { id },
      data: { status: dto.status },
      include: { farm: true },
    });

    return BatchDto.fromModel(updated);
  }

  async remove(id: string): Promise<void> {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException('Lote não encontrado.');
    }

    await this.prisma.batch.delete({ where: { id } });
  }
}
