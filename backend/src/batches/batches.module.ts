import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BatchCodeService } from './batch-code.service';
import { BatchDocumentsService } from './batch-documents.service';
import { BatchValidationService } from './batch-validation.service';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

@Module({
  imports: [PrismaModule],
  controllers: [BatchesController],
  providers: [
    BatchesService,
    BatchCodeService,
    BatchDocumentsService,
    BatchValidationService,
  ],
})
export class BatchesModule {}
