import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class QrPdfService {
  private readonly logger = new Logger(QrPdfService.name);

  async generateBatchQrPdf(input: {
    batchCode: string;
    publicTraceUrl: string;
    evidenceHash?: string;
    cnftAddress?: string;
    mintTxHash?: string;
  }) {
    const outputDir = this.resolveOutputDir();
    fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `${input.batchCode}.pdf`;
    const filePath = path.join(outputDir, fileName);
    const qrDataUrl = await QRCode.toDataURL(input.publicTraceUrl);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      doc.fontSize(22).text('AgroPass - Passaporte Digital do Produto');
      doc.moveDown();

      doc.fontSize(14).text(`Código do lote: ${input.batchCode}`);
      doc.text(`Link público: ${input.publicTraceUrl}`);

      if (input.evidenceHash) {
        doc.text(`Hash de evidência: ${input.evidenceHash}`);
      }

      if (input.cnftAddress) {
        doc.text(`Endereço cNFT: ${input.cnftAddress}`);
      }

      if (input.mintTxHash) {
        doc.text(`TX Solana: ${input.mintTxHash}`);
      }

      doc.moveDown();

      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');

      doc.image(qrBuffer, {
        fit: [220, 220],
        align: 'center',
      });

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return {
      filePath,
      publicUrl: this.resolvePublicUrl(fileName),
    };
  }

  private resolveOutputDir(): string {
    return path.resolve(
      process.cwd(),
      process.env.QR_PDF_OUTPUT_DIR ?? path.join('uploads', 'qrs'),
    );
  }

  private resolvePublicUrl(fileName: string): string {
    const publicBaseUrl =
      process.env.QR_PDF_PUBLIC_BASE_URL ?? process.env.PUBLIC_BACKEND_URL;

    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/+$/, '')}/uploads/qrs/${fileName}`;
    }

    this.logger.warn(
      'QR_PDF_PUBLIC_BASE_URL/PUBLIC_BACKEND_URL nao configurado; retornando path local relativo.',
    );

    return `/uploads/qrs/${fileName}`;
  }
}
