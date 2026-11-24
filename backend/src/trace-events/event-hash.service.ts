import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { TraceEventType } from '../../generated/prisma/enums';

export interface EventHashInput {
  batchId: string;
  sequence: number;
  type: TraceEventType;
  recordedById: string;
  recordedAt: Date;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  previousHash?: string | null;
  documentHashes?: string[];
  txHash?: string | null;
  correctedEventId?: string | null;
}

@Injectable()
export class EventHashService {
  generate(input: EventHashInput): string {
    const payload = JSON.stringify({
      batchId: input.batchId,
      sequence: input.sequence,
      type: input.type,
      recordedById: input.recordedById,
      recordedAt: input.recordedAt.toISOString(),
      location: input.location ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      notes: input.notes ?? null,
      previousHash: input.previousHash ?? null,
      documentHashes: [...(input.documentHashes ?? [])].sort(),
      txHash: input.txHash ?? null,
      correctedEventId: input.correctedEventId ?? null,
    });

    return createHash('sha256').update(payload).digest('hex');
  }
}
