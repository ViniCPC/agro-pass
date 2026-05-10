import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { DocumentType } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Injectable()
export class TelegramDocumentService {
  private readonly logger = new Logger(TelegramDocumentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRecentBatchesForProducer(producerId: string) {
    return this.prisma.batch.findMany({
      where: { farm: { producerId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, code: true, productType: true, quantity: true, unit: true },
    });
  }

  async getBatchIfOwned(batchId: string, producerId: string) {
    return this.prisma.batch.findFirst({
      where: { id: batchId, farm: { producerId } },
      select: { id: true, code: true },
    });
  }

  async downloadAndSave(params: {
    botToken: string;
    telegramFilePath: string;
    mimeType: string;
    batchId: string;
    documentType: DocumentType;
  }): Promise<{ documentId: string; fileUrl: string; fileHash: string }> {
    if (!ALLOWED_MIME_TYPES.includes(params.mimeType)) {
      throw new Error('Tipo de arquivo não aceito. Envie PDF, JPG ou PNG.');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${params.botToken}/${params.telegramFilePath}`;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Falha ao baixar arquivo do Telegram: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo permitido: 5MB.');
    }

    const fileHash = createHash('sha256').update(buffer).digest('hex');

    const existing = await this.prisma.document.findUnique({ where: { fileHash } });
    if (existing) {
      throw new Error('Este documento já foi enviado anteriormente.');
    }

    const ext = extname(params.telegramFilePath) || '.bin';
    const uploadDir = join(process.cwd(), 'uploads', 'documents');
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${params.batchId}-${Date.now()}-${randomUUID()}${ext}`;
    const filePath = join(uploadDir, fileName);
    const fileUrl = `/uploads/documents/${fileName}`;

    await writeFile(filePath, buffer);

    const document = await this.prisma.document.create({
      data: {
        type: params.documentType,
        fileUrl,
        fileHash,
        batchId: params.batchId,
      },
    });

    this.logger.log(`Documento salvo: ${fileUrl} (lote ${params.batchId})`);
    return { documentId: document.id, fileUrl, fileHash };
  }
}
