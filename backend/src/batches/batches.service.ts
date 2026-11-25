import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BatchStatus, TraceEventType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth-user.type';
import { EventChainService } from '../event-chain/event-chain.service';
import { BatchTokenizationService } from '../blockchain/batch-tokenization.service';
import { BatchAuthorizationService } from './batch-authorization.service';
import { BatchCodeService } from './batch-code.service';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { BatchDto } from './dto/batch.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { ListBatchesResponseDto } from './dto/list-batches-response.dto';
import { StageDetailsDto } from './dto/stage-details.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';
import { UpdateBatchVisibilityDto } from './dto/update-batch-visibility.dto';

const MAX_CODE_GENERATION_ATTEMPTS = 3;

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchCodeService: BatchCodeService,
    private readonly lifecycle: BatchLifecycleService,
    private readonly authorization: BatchAuthorizationService,
    private readonly eventChain: EventChainService,
    private readonly tokenization: BatchTokenizationService,
  ) {}

  async create(dto: CreateBatchDto, user: AuthUser): Promise<BatchDto> {
    const farm = await this.findFarmOrThrow(dto.farmId);
    this.authorization.assertCanCreate(farm.producerId, user);
    const harvestDate = dto.harvestDate ? new Date(dto.harvestDate) : undefined;

    for (let attempt = 1; attempt <= MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const code = await this.batchCodeService.generate(harvestDate);
      const createdAt = new Date();

      try {
        const batch = await this.prisma.$transaction(async (transaction) => {
          const created = await transaction.batch.create({
            data: {
              code,
              publicCode: code,
              productType: dto.productType,
              quantity: dto.quantity,
              unit: dto.unit.trim(),
              harvestDate: harvestDate ?? null,
              farmId: dto.farmId,
              createdAt,
            },
          });

          await this.eventChain.appendInTransaction(transaction, {
            batchId: created.id,
            type: TraceEventType.CREATED,
            recordedById: user.sub,
            recordedAt: createdAt,
            location: `${farm.city}, ${farm.state}`,
            latitude: farm.latitude,
            longitude: farm.longitude,
          });

          return transaction.batch.findUniqueOrThrow({
            where: { id: created.id },
            include: { farm: true },
          });
        });

        return BatchDto.fromModel(batch);
      } catch (error) {
        if (!this.isUniqueConstraintError(error)) {
          throw error;
        }

        if (attempt === MAX_CODE_GENERATION_ATTEMPTS) {
          throw new ConflictException(
            'Nao foi possivel gerar um codigo unico para o lote.',
          );
        }
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

  async updateStatus(
    id: string,
    dto: UpdateBatchStatusDto,
    user: AuthUser,
  ): Promise<BatchDto> {
    const { status, ...details } = dto;
    return this.transitionTo(id, status, user, details);
  }

  async cancel(
    id: string,
    user: AuthUser,
    details: StageDetailsDto = {},
  ): Promise<BatchDto> {
    return this.transitionTo(id, BatchStatus.CANCELLED, user, details);
  }

  async close(id: string, user: AuthUser): Promise<BatchDto> {
    return this.transitionTo(id, BatchStatus.CLOSED, user);
  }

  async updateVisibility(
    id: string,
    dto: UpdateBatchVisibilityDto,
  ): Promise<BatchDto> {
    await this.findBatchOrThrow(id);

    const updated = await this.prisma.batch.update({
      where: { id },
      data: { isPublic: dto.isPublic },
      include: { farm: true },
    });

    return BatchDto.fromModel(updated);
  }

  async getAllowedTransitions(id: string) {
    const batch = await this.findBatchOrThrow(id);

    return {
      currentStatus: batch.status,
      allowedTransitions: this.lifecycle.getAllowedTransitions(batch.status),
    };
  }

  private async transitionTo(
    id: string,
    nextStatus: BatchStatus,
    user: AuthUser,
    details: StageDetailsDto = {},
  ): Promise<BatchDto> {
    const updated = await this.prisma.$transaction(async (transaction) => {
      await this.eventChain.lockBatch(transaction, id);
      const batch = await transaction.batch.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          status: true,
          farm: {
            select: {
              producerId: true,
              producer: { select: { cooperativeId: true } },
            },
          },
        },
      });

      this.lifecycle.assertCanTransition(batch.status, nextStatus);
      this.authorization.assertCanTransition(batch, nextStatus, user);

      const changedAt = new Date();
      await transaction.batch.update({
        where: { id },
        data: {
          status: nextStatus,
          closedAt: nextStatus === BatchStatus.CLOSED ? changedAt : undefined,
        },
      });

      await this.eventChain.appendInTransaction(transaction, {
        batchId: id,
        type: nextStatus,
        recordedById: user.sub,
        recordedAt: changedAt,
        location: details.location?.trim() || null,
        latitude: details.latitude ?? null,
        longitude: details.longitude ?? null,
        notes: details.notes,
      });

      return transaction.batch.findUniqueOrThrow({
        where: { id },
        include: { farm: true },
      });
    });

    // Only after the closing transaction has committed: the on-chain proof is
    // registered in the background and can never roll the closing back.
    if (nextStatus === BatchStatus.CLOSED) {
      this.tokenization.scheduleAfterClose(id);
    }

    return BatchDto.fromModel(updated);
  }

  private async findFarmOrThrow(farmId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        id: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        producerId: true,
        producer: { select: { name: true, cooperativeId: true } },
      },
    });

    if (!farm) {
      throw new NotFoundException('Fazenda nao encontrada.');
    }

    return farm;
  }

  private async findBatchOrThrow(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        integrityHash: true,
        farm: {
          select: {
            producerId: true,
            producer: { select: { cooperativeId: true } },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    return batch;
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
