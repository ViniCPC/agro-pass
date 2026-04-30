import { TraceEvent, TraceEventType } from '../../../generated/prisma/client';

export class TraceEventDto {
  id!: string;
  type!: TraceEventType;
  actorName!: string;
  cooperativeId!: string | null;
  exporterId!: string | null;
  location!: string | null;
  latitude!: number | null;
  longitude!: number | null;
  eventHash!: string | null;
  txHash!: string | null;
  batchId!: string;
  createdAt!: Date;

  static fromModel(event: TraceEvent): TraceEventDto {
    return {
      id: event.id,
      type: event.type,
      actorName: event.actorName,
      cooperativeId: event.cooperativeId,
      exporterId: event.exporterId,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      eventHash: event.eventHash,
      txHash: event.txHash,
      batchId: event.batchId,
      createdAt: event.createdAt,
    };
  }
}
