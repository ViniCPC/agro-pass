import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SolanaModule } from '../solana/solana.module';
import { EventChainModule } from '../event-chain/event-chain.module';
import { StorageModule } from '../storage/storage.module';
import { BatchCodeService } from './batch-code.service';
import { BatchAuthorizationService } from './batch-authorization.service';
import { BatchDocumentsService } from './batch-documents.service';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { BatchQrCodeService } from './batch-qrcode.service';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

@Module({
  imports: [PrismaModule, EventChainModule, StorageModule, SolanaModule],
  controllers: [BatchesController],
  providers: [
    BatchesService,
    BatchAuthorizationService,
    BatchCodeService,
    BatchDocumentsService,
    BatchLifecycleService,
    BatchQrCodeService,
  ],
  exports: [BatchesService, BatchLifecycleService, BatchAuthorizationService],
})
export class BatchesModule {}
