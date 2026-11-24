import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventHashService } from '../trace-events/event-hash.service';
import { EventChainService } from './event-chain.service';

@Module({
  imports: [PrismaModule],
  providers: [EventHashService, EventChainService],
  exports: [EventHashService, EventChainService],
})
export class EventChainModule {}
