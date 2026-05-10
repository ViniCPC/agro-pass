import type { TraceEvent } from '../../../generated/prisma/client';
import type { DocumentType, TraceEventType } from '../../../generated/prisma/enums';

type TraceEventWithDocument = TraceEvent & {
  document?: {
    id: string;
    type: DocumentType;
    fileUrl: string;
    fileHash: string;
    createdAt: Date;
  } | null;
};

export class TraceEventDocumentDto {
  id!: string;
  type!: DocumentType;
  fileUrl!: string;
  fileHash!: string;
  createdAt!: Date;
}

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
  customStageName!: string | null;
  documentId!: string | null;
  document!: TraceEventDocumentDto | null;
  batchId!: string;
  createdAt!: Date;

  static fromModel(event: TraceEventWithDocument): TraceEventDto {
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
      customStageName: event.customStageName,
      documentId: event.documentId,
      document: event.document
        ? {
            id: event.document.id,
            type: event.document.type,
            fileUrl: event.document.fileUrl,
            fileHash: event.document.fileHash,
            createdAt: event.document.createdAt,
          }
        : null,
      batchId: event.batchId,
      createdAt: event.createdAt,
    };
  }
}
