import type { Document as DocumentModel } from '../../../generated/prisma/client';
import type { DocumentType } from '../../../generated/prisma/enums';

export class DocumentDto {
  id!: string;
  type!: DocumentType;
  originalName!: string;
  fileUrl!: string;
  size!: number;
  mimeType!: string;
  fileHash!: string;
  isPublic!: boolean;
  batchId!: string | null;
  traceEventId!: string | null;
  createdAt!: Date;

  static fromModel(document: DocumentModel): DocumentDto {
    return {
      id: document.id,
      type: document.type,
      originalName: document.originalName,
      fileUrl: document.fileUrl,
      size: document.size,
      mimeType: document.mimeType,
      fileHash: document.fileHash,
      isPublic: document.isPublic,
      batchId: document.batchId,
      traceEventId: document.traceEventId,
      createdAt: document.createdAt,
    };
  }
}
