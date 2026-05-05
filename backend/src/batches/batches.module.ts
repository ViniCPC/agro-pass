import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SolanaModule } from '../solana/solana.module';
import { BatchCodeService } from './batch-code.service';
import { BatchDocumentsService } from './batch-documents.service';
import { BatchQrCodeService } from './batch-qrcode.service';
import { BatchValidationService } from './batch-validation.service';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

@Module({
  imports: [PrismaModule, SolanaModule],
  controllers: [BatchesController],
  providers: [
    BatchesService,
    BatchCodeService,
    BatchDocumentsService,
    BatchValidationService,
    BatchQrCodeService,
  ],
  exports: [BatchesService],
})
export class BatchesModule {}
