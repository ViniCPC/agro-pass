import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { resolve, sep } from 'path';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Public()
@Controller('uploads/documents')
export class PublicFilesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':filename')
  async download(
    @Param('filename') filename: string,
    @Res() response: Response,
  ) {
    // The URL alone is never authorization. Recheck visibility on every read,
    // including after a previously public document/passport becomes private.
    if (!/^[\w.-]+$/.test(filename)) throw new NotFoundException();
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
    if (!document) throw new NotFoundException('Documento nao disponivel.');
    const root = resolve(process.cwd(), 'uploads');
    const path = resolve(root, key);
    if (!path.startsWith(`${root}${sep}`)) throw new NotFoundException();
    response.setHeader('Content-Type', document.mimeType);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Content-Disposition', 'attachment');
    return new Promise<void>((accept, reject) => {
      response.sendFile(path, (error) =>
        error
          ? reject(new NotFoundException('Arquivo indisponivel.'))
          : accept(),
      );
    });
  }
}
