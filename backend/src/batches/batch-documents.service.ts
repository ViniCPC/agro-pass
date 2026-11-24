import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import 'multer';
import { TraceEventType } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { EventChainService } from '../event-chain/event-chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { FILE_STORAGE, type FileStorage } from '../storage/file-storage';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { BatchAuthorizationService } from './batch-authorization.service';
import { DocumentDto } from './dto/document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_IN_BYTES = 5 * 1024 * 1024;

@Injectable()
export class BatchDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: BatchLifecycleService,
    private readonly authorization: BatchAuthorizationService,
    private readonly eventChain: EventChainService,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorage,
  ) {}

  async addDocument(
    batchId: string,
    dto: UploadDocumentDto,
    user: AuthUser,
    file?: Express.Multer.File,
  ): Promise<DocumentDto> {
    const batch = await this.findBatchOrThrow(batchId);
    this.lifecycle.assertMutable(batch.status);
    this.authorization.assertCanManageDocuments(batch, user);
    this.validateUploadedFile(file);

    const storedFile = await this.fileStorage.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    const existingDocument = await this.prisma.document.findUnique({
      where: { fileHash: storedFile.hash },
    });

    if (existingDocument) {
      await this.fileStorage.delete(storedFile.key);
      throw new ConflictException(
        'Este documento ja foi enviado anteriormente.',
      );
    }

    try {
      const document = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.document.create({
          data: {
            type: dto.type,
            originalName: storedFile.originalName,
            storageKey: storedFile.key,
            fileUrl: storedFile.url,
            size: storedFile.size,
            mimeType: storedFile.mimeType,
            fileHash: storedFile.hash,
            isPublic: dto.isPublic ?? false,
            batchId,
          },
        });

        await this.eventChain.appendInTransaction(transaction, {
          batchId,
          type: TraceEventType.DOCUMENT_ATTACHED,
          recordedById: user.sub,
          notes: `Documento anexado: ${storedFile.originalName}`,
          documentIds: [created.id],
        });

        return transaction.document.findUniqueOrThrow({
          where: { id: created.id },
        });
      });

      return DocumentDto.fromModel(document);
    } catch (error) {
      await this.fileStorage.delete(storedFile.key).catch(() => undefined);

      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Este documento ja foi enviado anteriormente.',
        );
      }

      throw error;
    }
  }

  async findDocuments(batchId: string): Promise<DocumentDto[]> {
    await this.findBatchOrThrow(batchId);

    const documents = await this.prisma.document.findMany({
      where: { batchId },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((document) => DocumentDto.fromModel(document));
  }

  // Visibility is not part of the hashed event, so it can change after the
  // passport is closed without breaking the chain.
  async updateVisibility(
    batchId: string,
    documentId: string,
    isPublic: boolean,
    user: AuthUser,
  ): Promise<DocumentDto> {
    const batch = await this.findBatchOrThrow(batchId);
    this.authorization.assertCanManageDocuments(batch, user);

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, batchId },
      select: { id: true },
    });

    if (!document) {
      throw new NotFoundException('Documento nao encontrado neste lote.');
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { isPublic },
    });

    return DocumentDto.fromModel(updated);
  }

  private validateUploadedFile(
    file?: Express.Multer.File,
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo invalido. Envie PDF, JPG ou PNG.',
      );
    }

    if (file.size > MAX_FILE_SIZE_IN_BYTES) {
      throw new BadRequestException(
        'Arquivo muito grande. Maximo permitido: 5MB.',
      );
    }
  }

  private async findBatchOrThrow(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        status: true,
        farm: {
          select: {
            producerId: true,
            producer: { select: { cooperativeId: true } },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    return batch;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
