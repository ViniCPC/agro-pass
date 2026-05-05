import { Module } from '@nestjs/common';
import { QrPdfService } from './qr-pdf.service';

@Module({
  providers: [QrPdfService],
  exports: [QrPdfService],
})
export class QrModule {}
