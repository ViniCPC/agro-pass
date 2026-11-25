import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { FILE_STORAGE } from './file-storage';
import type { FileStorage } from './file-storage';

@Public()
@Controller('uploads/documents')
export class PublicFilesController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
  ) {}

  @Get(':filename')
  async download(
    @Param('filename') filename: string,
    @Res() response: Response,
  ) {
    // The URL alone is never authorization. Recheck visibility on every read,
    // including after a previously public document/passport becomes private.
    if (!/^[\w.-]+$/.test(filename)) {
      throw new NotFoundException();
    }

    const key = `documents/${filename}`;

    const document = await this.prisma.document.findFirst({
      where: {
        storageKey: key,
        isPublic: true,
        OR: [
          { batch: { isPublic: true } },
          { batchId: null, farm: { batches: { some: { isPublic: true } } } },
        ],
      },
      select: { mimeType: true },
    });

    if (!document) {
      throw new NotFoundException('Documento nao disponivel.');
    }

    let buffer: Buffer;

    try {
      buffer = await this.storage.download(key);
    } catch {
      throw new NotFoundException('Arquivo indisponivel.');
    }

    response.setHeader('Content-Type', document.mimeType);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Content-Disposition', 'attachment');

    return response.send(buffer);
  }
}
