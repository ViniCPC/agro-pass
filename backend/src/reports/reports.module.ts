import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EudrReportController } from './eudr-report.controller';
import { EudrReportService } from './eudr-report.service';

@Module({
  imports: [PrismaModule],
  controllers: [EudrReportController],
  providers: [EudrReportService],
})
export class ReportsModule {}
