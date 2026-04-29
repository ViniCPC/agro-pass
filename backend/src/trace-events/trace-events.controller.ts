import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { TraceEventsService } from './trace-events.service';
import { CreateTraceEventDto } from './dto/create-trace-event.dto';
import { TraceEventDto } from './dto/trace-event.dto';

@Controller('batches/:id/events')
export class TraceEventsController {
  constructor(private readonly traceEventsService: TraceEventsService) {}

  @Post()
  create(
    @Param('id', ParseUUIDPipe) batchId: string,
    @Body() dto: CreateTraceEventDto,
  ): Promise<TraceEventDto> {
    return this.traceEventsService.create(batchId, dto);
  }

  @Get()
  findAll(@Param('id', ParseUUIDPipe) batchId: string): Promise<TraceEventDto[]> {
    return this.traceEventsService.findAllByBatch(batchId);
  }
}
