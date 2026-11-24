import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { TraceEventType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { EventHashService } from '../trace-events/event-hash.service';

export interface AppendEventInput {
  batchId: string;
  type: TraceEventType;
  recordedById: string;
  recordedAt?: Date;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  txHash?: string | null;
  documentIds?: string[];
  correctedEventId?: string | null;
}

export interface ChainIntegrityResult {
  valid: boolean;
  eventCount: number;
  finalHash: string | null;
  storedFinalHash: string | null;
  errors: Array<{
    sequence: number | null;
    code: string;
    message: string;
  }>;
}

@Injectable()
export class EventChainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventHash: EventHashService,
  ) {}

  append(input: AppendEventInput) {
    return this.prisma.$transaction(async (transaction) =>
      this.appendInTransaction(transaction, input),
    );
  }

  async lockBatch(
    transaction: Prisma.TransactionClient,
    batchId: string,
  ): Promise<void> {
    const rows = await transaction.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT "id" FROM "Batch" WHERE "id" = ${batchId} FOR UPDATE`,
    );

    if (rows.length === 0) {
      throw new NotFoundException('Lote nao encontrado.');
    }
  }

  async appendInTransaction(
    transaction: Prisma.TransactionClient,
    input: AppendEventInput,
  ) {
    await this.lockBatch(transaction, input.batchId);

    const previousEvent = await transaction.traceEvent.findFirst({
      where: { batchId: input.batchId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true, eventHash: true },
    });

    const documentIds = [...new Set(input.documentIds ?? [])];
    const documents = documentIds.length
      ? await transaction.document.findMany({
          where: {
            id: { in: documentIds },
            batchId: input.batchId,
            traceEventId: null,
          },
          select: { id: true, fileHash: true },
        })
      : [];

    if (documents.length !== documentIds.length) {
      throw new BadRequestException(
        'Um ou mais documentos nao pertencem ao lote ou ja foram anexados.',
      );
    }

    if (input.correctedEventId) {
      const correctedEvent = await transaction.traceEvent.findFirst({
        where: {
          id: input.correctedEventId,
          batchId: input.batchId,
        },
        select: { id: true },
      });

      if (!correctedEvent) {
        throw new BadRequestException(
          'O evento corrigido nao pertence ao lote informado.',
        );
      }
    }

    const sequence = (previousEvent?.sequence ?? 0) + 1;
    const previousHash = previousEvent?.eventHash ?? null;
    const recordedAt = input.recordedAt ?? new Date();
    const notes = input.notes?.trim() || null;
    const eventHash = this.eventHash.generate({
      batchId: input.batchId,
      sequence,
      type: input.type,
      recordedById: input.recordedById,
      recordedAt,
      location: input.location,
      latitude: input.latitude,
      longitude: input.longitude,
      notes,
      previousHash,
      documentHashes: documents.map((document) => document.fileHash),
      txHash: input.txHash,
      correctedEventId: input.correctedEventId,
    });

    const event = await transaction.traceEvent.create({
      data: {
        batchId: input.batchId,
        sequence,
        type: input.type,
        recordedById: input.recordedById,
        recordedAt,
        location: input.location ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        notes,
        previousHash,
        eventHash,
        txHash: input.txHash ?? null,
        correctedEventId: input.correctedEventId ?? null,
        documents: documentIds.length
          ? { connect: documentIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        recordedBy: { select: { id: true, name: true, role: true } },
        documents: { orderBy: { createdAt: 'asc' } },
      },
    });

    await transaction.batch.update({
      where: { id: input.batchId },
      data: { integrityHash: eventHash },
    });

    return event;
  }

  async verify(batchId: string): Promise<ChainIntegrityResult> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        integrityHash: true,
        traceEvents: {
          orderBy: { sequence: 'asc' },
          include: {
            documents: {
              select: { fileHash: true },
              orderBy: { fileHash: 'asc' },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    const errors: ChainIntegrityResult['errors'] = [];
    let previousHash: string | null = null;

    if (batch.traceEvents.length === 0) {
      errors.push({
        sequence: null,
        code: 'EMPTY_CHAIN',
        message: 'O lote nao possui eventos de rastreabilidade.',
      });
    }

    for (let index = 0; index < batch.traceEvents.length; index += 1) {
      const event = batch.traceEvents[index];
      const expectedSequence = index + 1;

      if (event.sequence !== expectedSequence) {
        errors.push({
          sequence: event.sequence,
          code: 'INVALID_SEQUENCE',
          message: `Esperada sequencia ${expectedSequence}, encontrada ${event.sequence}.`,
        });
      }

      if (event.previousHash !== previousHash) {
        errors.push({
          sequence: event.sequence,
          code: 'INVALID_PREVIOUS_HASH',
          message: 'O hash anterior nao corresponde ao evento precedente.',
        });
      }

      const calculatedHash = this.eventHash.generate({
        batchId: event.batchId,
        sequence: event.sequence,
        type: event.type,
        recordedById: event.recordedById,
        recordedAt: event.recordedAt,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        notes: event.notes,
        previousHash: event.previousHash,
        documentHashes: event.documents.map((document) => document.fileHash),
        txHash: event.txHash,
        correctedEventId: event.correctedEventId,
      });

      if (calculatedHash !== event.eventHash) {
        errors.push({
          sequence: event.sequence,
          code: 'INVALID_EVENT_HASH',
          message: 'Os dados armazenados nao correspondem ao hash do evento.',
        });
      }

      previousHash = event.eventHash;
    }

    const finalHash = batch.traceEvents.at(-1)?.eventHash ?? null;
    if (finalHash !== batch.integrityHash) {
      errors.push({
        sequence: null,
        code: 'INVALID_FINAL_HASH',
        message: 'O hash final do lote nao corresponde ao fim da cadeia.',
      });
    }

    return {
      valid: errors.length === 0,
      eventCount: batch.traceEvents.length,
      finalHash,
      storedFinalHash: batch.integrityHash,
      errors,
    };
  }
}
