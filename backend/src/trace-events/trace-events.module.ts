import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventChainModule } from '../event-chain/event-chain.module';
import { TraceEventsController } from './trace-events.controller';
import { TraceEventsService } from './trace-events.service';

@Module({
  imports: [PrismaModule, EventChainModule, BatchesModule],
  controllers: [TraceEventsController],
  providers: [TraceEventsService],
  exports: [TraceEventsService],
})
export class TraceEventsModule {}
