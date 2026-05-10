import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TraceEventsController } from './trace-events.controller';
import { TraceEventsService } from './trace-events.service';
import { EventHashService } from './event-hash.service';

@Module({
  imports: [PrismaModule],
  controllers: [TraceEventsController],
  providers: [TraceEventsService, EventHashService],
  exports: [TraceEventsService],
})
export class TraceEventsModule {}
