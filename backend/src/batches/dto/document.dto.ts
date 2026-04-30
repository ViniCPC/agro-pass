import type { Document as DocumentModel } from '../../../generated/prisma/client';
import type { DocumentType } from '../../../generated/prisma/enums';

export class DocumentDto {
  id!: string;
  type!: DocumentType;
  fileUrl!: string;
  fileHash!: string;
  batchId!: string | null;
  createdAt!: Date;

  static fromModel(document: DocumentModel): DocumentDto {
    return {
      id: document.id,
      type: document.type,
      fileUrl: document.fileUrl,
      fileHash: document.fileHash,
      batchId: document.batchId,
      createdAt: document.createdAt,
    };
  }
}
