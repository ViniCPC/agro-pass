import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

type QrGenerationResult = {
  qrCodeUrl: string;
  targetUrl: string;
  batchId: string;
  batchCode: string;
  publicCode: string;
};

const ALLOWED_PRINT_COPIES = [4, 8, 16] as const;
type AllowedPrintCopies = (typeof ALLOWED_PRINT_COPIES)[number];

const DEV_PUBLIC_APP_URL = 'http://localhost:5173';

@Injectable()
export class BatchQrCodeService {
  constructor(private readonly prisma: PrismaService) {}

  // The image is rendered on demand and returned inline instead of being
  // written to local disk: nothing is lost when the container is redeployed,
  // and the QR always encodes the currently configured public URL.
  async generateQrCode(batchId: string): Promise<QrGenerationResult> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, code: true, publicCode: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    const targetUrl = this.buildTraceTargetUrl(batch.publicCode);
    const qrCodeUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return {
      qrCodeUrl,
      targetUrl,
      batchId: batch.id,
      batchCode: batch.code,
      publicCode: batch.publicCode,
    };
  }

  async generatePrintSheetPdf(batchId: string, copiesRaw = 8): Promise<Buffer> {
    if (!ALLOWED_PRINT_COPIES.includes(copiesRaw as AllowedPrintCopies)) {
      throw new BadRequestException(
        'Parametro copies invalido. Use 4, 8 ou 16.',
      );
    }

    const copies = copiesRaw as AllowedPrintCopies;
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, code: true, publicCode: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    const qrBuffer = await QRCode.toBuffer(
      this.buildTraceTargetUrl(batch.publicCode),
      { type: 'png', width: 400 },
    );

    return this.renderPrintSheetPdf({
      batchCode: batch.code,
      copies,
      qrBuffer,
    });
  }

  private buildTraceTargetUrl(publicCode: string): string {
    return `${this.resolvePublicAppUrl()}/trace/${encodeURIComponent(publicCode)}`;
  }

  // A printed label cannot be fixed later, so production refuses to encode a
  // fallback localhost URL instead of silently printing broken QR codes.
  private resolvePublicAppUrl(): string {
    const configured = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, '');
    if (configured) return configured;

    if (process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException(
        'PUBLIC_APP_URL nao configurado: defina a URL publica do frontend antes de gerar QR Codes.',
      );
    }

    return DEV_PUBLIC_APP_URL;
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
      doc.on('data', (chunk: Uint8Array) => chunks.push(Buffer.from(chunk)));
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
      const availableHeight =
        pageHeight - (headerBottomY - doc.page.margins.top);

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
