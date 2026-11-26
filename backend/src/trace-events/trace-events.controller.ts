import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TraceEventsService } from './trace-events.service';
import { CreateTraceEventDto } from './dto/create-trace-event.dto';
import { TraceEventDto } from './dto/trace-event.dto';
import { UserRole } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { BatchAccessGuard } from '../access/batch-access.guard';

@Controller('batches/:id/events')
@UseGuards(BatchAccessGuard)
export class TraceEventsController {
  constructor(private readonly traceEventsService: TraceEventsService) {}

  @Post()
  @Roles(
    UserRole.PRODUCER,
    UserRole.COOPERATIVE,
    UserRole.OPERATOR,
    UserRole.ADMIN,
  )
  create(
    @Param('id', ParseUUIDPipe) batchId: string,
    @Body() dto: CreateTraceEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<TraceEventDto> {
    return this.traceEventsService.create(batchId, dto, user);
  }

  @Get()
  findAll(
    @Param('id', ParseUUIDPipe) batchId: string,
  ): Promise<TraceEventDto[]> {
    return this.traceEventsService.findAllByBatch(batchId);
  }

  @Get('integrity')
  verifyIntegrity(@Param('id', ParseUUIDPipe) batchId: string) {
    return this.traceEventsService.verifyIntegrity(batchId);
  }
}
