import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TraceEventType } from '../../generated/prisma/enums';
import { BatchAuthorizationService } from '../batches/batch-authorization.service';
import type { AuthUser } from '../auth/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { EventChainService } from '../event-chain/event-chain.service';
import { CreateTraceEventDto } from './dto/create-trace-event.dto';
import { TraceEventDto } from './dto/trace-event.dto';

@Injectable()
export class TraceEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventChain: EventChainService,
    private readonly authorization: BatchAuthorizationService,
  ) {}

  async create(
    batchId: string,
    dto: CreateTraceEventDto,
    user: AuthUser,
  ): Promise<TraceEventDto> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        farm: {
          select: {
            producerId: true,
            producer: { select: { cooperativeId: true } },
          },
        },
      },
    });
    if (!batch) throw new NotFoundException('Lote nao encontrado.');
    if (dto.type !== TraceEventType.CORRECTION) {
      throw new BadRequestException(
        'Etapas do ciclo devem ser registradas pela transicao de status.',
      );
    }

    this.authorization.assertCanAddEvent(batch, dto.type, user);

    if (!dto.notes?.trim() || !dto.correctedEventId) {
      throw new BadRequestException(
        'Uma correcao exige justificativa e o evento que esta sendo corrigido.',
      );
    }

    const event = await this.eventChain.append({
      batchId,
      type: dto.type,
      recordedById: user.sub,
      location: dto.location,
      latitude: dto.latitude,
      longitude: dto.longitude,
      notes: dto.notes,
      documentIds: dto.documentIds,
      correctedEventId: dto.correctedEventId,
    });

    return TraceEventDto.fromModel(event);
  }

  async findAllByBatch(batchId: string): Promise<TraceEventDto[]> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });
    if (!batch) throw new NotFoundException('Lote nao encontrado.');

    const events = await this.prisma.traceEvent.findMany({
      where: { batchId },
      orderBy: { sequence: 'asc' },
      include: {
        recordedBy: { select: { id: true, name: true, role: true } },
        documents: { orderBy: { createdAt: 'asc' } },
      },
    });

    return events.map((event) => TraceEventDto.fromModel(event));
  }

  verifyIntegrity(batchId: string) {
    return this.eventChain.verify(batchId);
  }
}
