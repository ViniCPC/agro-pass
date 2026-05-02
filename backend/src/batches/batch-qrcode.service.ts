import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BatchQrCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async generateQrCode(batchId: string): Promise<{ qrCodeUrl: string; targetUrl: string; batchId: string; batchCode: string }> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, code: true, qrCodeUrl: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173';
    const targetUrl = `${baseUrl}/batches/${batch.code}`;

    const uploadDir = join(process.cwd(), 'uploads', 'qrcodes');
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${batchId}-${randomUUID()}.png`;
    const filePath = join(uploadDir, fileName);
    const qrCodeUrl = `/uploads/qrcodes/${fileName}`;

    const buffer = await QRCode.toBuffer(targetUrl, { type: 'png', width: 400 });
    await writeFile(filePath, buffer);

    await this.prisma.batch.update({
      where: { id: batchId },
      data: { qrCodeUrl },
    });

    return { qrCodeUrl, targetUrl, batchId: batch.id, batchCode: batch.code };
  }
}
