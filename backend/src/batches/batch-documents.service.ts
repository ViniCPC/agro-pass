import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import 'multer';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentDto } from './dto/document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_IN_BYTES = 5 * 1024 * 1024;

@Injectable()
export class BatchDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async addDocument(
    batchId: string,
    dto: UploadDocumentDto,
    file?: Express.Multer.File,
  ): Promise<DocumentDto> {
    await this.findBatchOrThrow(batchId);
    this.validateUploadedFile(file);

    const fileHash = this.generateFileHash(file.buffer);
    const existingDocument = await this.prisma.document.findUnique({
      where: { fileHash },
    });

    if (existingDocument) {
      throw new ConflictException(
        'Este documento ja foi enviado anteriormente.',
      );
    }

    const uploadDir = join(process.cwd(), 'uploads', 'documents');
    await mkdir(uploadDir, { recursive: true });

    const extension = extname(file.originalname);
    const fileName = `${batchId}-${Date.now()}-${randomUUID()}${extension}`;
    const filePath = join(uploadDir, fileName);
    const fileUrl = `/uploads/documents/${fileName}`;

    await writeFile(filePath, file.buffer);

    try {
      const document = await this.prisma.document.create({
        data: {
          type: dto.type,
          fileUrl,
          fileHash,
          batchId,
        },
      });

      return DocumentDto.fromModel(document);
    } catch (error) {
      await unlink(filePath).catch(() => undefined);

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

  private generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async findBatchOrThrow(batchId: string): Promise<void> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }
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
