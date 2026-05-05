import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { EudrReportService } from './eudr-report.service';

@Controller('batches')
export class EudrReportController {
  constructor(private readonly eudrReportService: EudrReportService) {}

  @Get(':id/eudr-report.pdf')
  @Header('Content-Type', 'application/pdf')
  async getEudrReport(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const report = await this.eudrReportService.generate(id);

    response.setHeader(
      'Content-Disposition',
      `inline; filename="${report.fileName}"`,
    );

    return new StreamableFile(report.pdfBuffer);
  }
}
