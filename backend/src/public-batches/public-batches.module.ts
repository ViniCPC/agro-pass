import { Module } from '@nestjs/common';
import { PublicBatchesController } from './public-batches.controller';
import { PublicBatchesService } from './public-batches.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventChainModule } from '../event-chain/event-chain.module';

@Module({
  imports: [PrismaModule, EventChainModule],
  controllers: [PublicBatchesController],
  providers: [PublicBatchesService],
})
export class PublicBatchesModule {}
