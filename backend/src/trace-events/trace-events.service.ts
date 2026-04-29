import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventHashService } from './event-hash.service';
import { CreateTraceEventDto } from './dto/create-trace-event.dto';
import { TraceEventDto } from './dto/trace-event.dto';

@Injectable()
export class TraceEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventHash: EventHashService,
  ) {}

  async create(batchId: string, dto: CreateTraceEventDto): Promise<TraceEventDto> {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Lote não encontrado.');

    const now = new Date();

    const hash = this.eventHash.generate({
      batchId,
      type: dto.type,
      actorName: dto.actorName,
      location: dto.location,
      latitude: dto.latitude,
      longitude: dto.longitude,
      cooperativeId: dto.cooperativeId,
      exporterId: dto.exporterId,
      createdAt: now,
    });

    const event = await this.prisma.traceEvent.create({
      data: {
        type: dto.type,
        actorName: dto.actorName,
        cooperativeId: dto.cooperativeId ?? null,
        exporterId: dto.exporterId ?? null,
        location: dto.location ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        eventHash: hash,
        batchId,
        createdAt: now,
      },
    });

    return TraceEventDto.fromModel(event);
  }

  async findAllByBatch(batchId: string): Promise<TraceEventDto[]> {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Lote não encontrado.');

    const events = await this.prisma.traceEvent.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' },
    });

    return events.map(TraceEventDto.fromModel);
  }
}
