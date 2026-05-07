import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

type QrGenerationResult = {
  qrCodeUrl: string;
  targetUrl: string;
  batchId: string;
  batchCode: string;
};

const ALLOWED_PRINT_COPIES = [4, 8, 16] as const;
type AllowedPrintCopies = (typeof ALLOWED_PRINT_COPIES)[number];

@Injectable()
export class BatchQrCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async generateQrCode(batchId: string): Promise<QrGenerationResult> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, code: true, qrCodeUrl: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    const targetUrl = this.buildTraceTargetUrl(batch.code);

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

  async generatePrintSheetPdf(
    batchId: string,
    copiesRaw = 8,
  ): Promise<Buffer> {
    if (!ALLOWED_PRINT_COPIES.includes(copiesRaw as AllowedPrintCopies)) {
      throw new BadRequestException(
        'Parametro copies invalido. Use 4, 8 ou 16.',
      );
    }

    const copies = copiesRaw as AllowedPrintCopies;
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, code: true, qrCodeUrl: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    let qrCodeUrl = batch.qrCodeUrl;
    if (!qrCodeUrl) {
      const generated = await this.generateQrCode(batch.id);
      qrCodeUrl = generated.qrCodeUrl;
    }

    const qrImagePath = join(process.cwd(), qrCodeUrl.replace(/^\//, ''));
    const qrBuffer = await readFile(qrImagePath);

    return this.renderPrintSheetPdf({
      batchCode: batch.code,
      copies,
      qrBuffer,
    });
  }

  private buildTraceTargetUrl(batchCode: string): string {
    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173';
    return `${baseUrl}/trace/${encodeURIComponent(batchCode)}`;
  }

  private renderPrintSheetPdf({
    batchCode,
    copies,
    qrBuffer,
  }: {
    batchCode: string;
    copies: AllowedPrintCopies;
    qrBuffer: Buffer;
  }): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 28,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const pageHeight =
        doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

      doc.font('Helvetica-Bold').fontSize(15).text(`AgroPass QR Sheet`);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#4b5653')
        .text(
          `Lote ${batchCode} · Cole esses QR codes nos fardos antes de entregar pra cooperativa`,
        );
      doc.moveDown(0.8);

      const headerBottomY = doc.y + 4;
      const availableHeight = pageHeight - (headerBottomY - doc.page.margins.top);

      const { columns, rows } = this.getSheetLayout(copies);
      const gap = 10;
      const cellWidth = (pageWidth - gap * (columns - 1)) / columns;
      const cellHeight = (availableHeight - gap * (rows - 1)) / rows;

      const baseX = doc.page.margins.left;
      const baseY = headerBottomY;

      for (let index = 0; index < copies; index += 1) {
        const row = Math.floor(index / columns);
        const column = index % columns;

        const x = baseX + column * (cellWidth + gap);
        const y = baseY + row * (cellHeight + gap);

        doc.save();
        doc.dash(3, { space: 2 });
        doc.rect(x, y, cellWidth, cellHeight).stroke('#94a3b8');
        doc.undash();
        doc.restore();

        const qrSize = Math.min(cellWidth, cellHeight) - 26;
        const finalQrSize = Math.max(68, qrSize);
        const imageX = x + (cellWidth - finalQrSize) / 2;
        const imageY = y + 8;
        doc.image(qrBuffer, imageX, imageY, {
          width: finalQrSize,
          height: finalQrSize,
        });

        doc
          .font('Courier')
          .fontSize(8)
          .fillColor('#1a2120')
          .text(batchCode, x + 4, imageY + finalQrSize + 4, {
            width: cellWidth - 8,
            align: 'center',
          });
      }

      doc.end();
    });
  }

  private getSheetLayout(copies: AllowedPrintCopies): {
    columns: number;
    rows: number;
  } {
    if (copies === 4) return { columns: 2, rows: 2 };
    if (copies === 8) return { columns: 4, rows: 2 };
    return { columns: 4, rows: 4 };
  }
}
