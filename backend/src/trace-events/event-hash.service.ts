import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { TraceEventType } from '../../generated/prisma/enums';

interface EventHashInput {
  batchId: string;
  type: TraceEventType;
  actorName: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cooperativeId?: string | null;
  exporterId?: string | null;
  createdAt: Date;
}

@Injectable()
export class EventHashService {
  generate(input: EventHashInput): string {
    const payload = JSON.stringify({
      batchId: input.batchId,
      type: input.type,
      actorName: input.actorName,
      location: input.location ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      cooperativeId: input.cooperativeId ?? null,
      exporterId: input.exporterId ?? null,
      createdAt: input.createdAt.toISOString(),
    });

    return createHash('sha256').update(payload).digest('hex');
  }
}
