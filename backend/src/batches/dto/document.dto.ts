import {
  Document as DocumentModel,
  DocumentType,
} from '../../../generated/prisma/client';

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
