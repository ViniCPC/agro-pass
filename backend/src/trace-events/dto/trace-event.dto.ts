import type {
  Document as DocumentModel,
  TraceEvent,
} from '../../../generated/prisma/client';
import type {
  DocumentType,
  TraceEventType,
  UserRole,
} from '../../../generated/prisma/enums';

type TraceEventWithRelations = TraceEvent & {
  recordedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  documents: DocumentModel[];
};

export class TraceEventDocumentDto {
  id!: string;
  type!: DocumentType;
  originalName!: string;
  fileUrl!: string;
  size!: number;
  mimeType!: string;
  fileHash!: string;
  createdAt!: Date;
}

export class TraceEventDto {
  id!: string;
  type!: TraceEventType;
  sequence!: number;
  location!: string | null;
  latitude!: number | null;
  longitude!: number | null;
  notes!: string | null;
  previousHash!: string | null;
  eventHash!: string;
  txHash!: string | null;
  batchId!: string;
  recordedById!: string;
  recordedBy!: { id: string; name: string; role: UserRole };
  recordedAt!: Date;
  correctedEventId!: string | null;
  documents!: TraceEventDocumentDto[];

  // Aliases temporarios para clientes da API anterior.
  actorName!: string;
  userId!: string;
  createdAt!: Date;
  customStageName!: string | null;
  documentId!: string | null;
  document!: TraceEventDocumentDto | null;

  static fromModel(event: TraceEventWithRelations): TraceEventDto {
    const documents = event.documents.map((document) => ({
      id: document.id,
      type: document.type,
      originalName: document.originalName,
      fileUrl: document.fileUrl,
      size: document.size,
      mimeType: document.mimeType,
      fileHash: document.fileHash,
      createdAt: document.createdAt,
    }));

    return {
      id: event.id,
      type: event.type,
      sequence: event.sequence,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      notes: event.notes,
      previousHash: event.previousHash,
      eventHash: event.eventHash,
      txHash: event.txHash,
      batchId: event.batchId,
      recordedById: event.recordedById,
      recordedBy: event.recordedBy,
      recordedAt: event.recordedAt,
      correctedEventId: event.correctedEventId,
      documents,
      actorName: event.recordedBy.name,
      userId: event.recordedById,
      createdAt: event.recordedAt,
      customStageName: event.notes,
      documentId: documents[0]?.id ?? null,
      document: documents[0] ?? null,
    };
  }
}
