import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '../../generated/prisma/enums';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RealAccountGuard } from '../access/real-account.guard';
import {
  DEMO_REQUEST_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
} from '../common/rate-limit';
import { DemoRequestsService } from './demo-requests.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';

@Controller()
export class DemoRequestsController {
  constructor(private readonly demoRequests: DemoRequestsService) {}

  // Landing page form. Public, with its own tight rate limit.
  @Public()
  @Throttle({
    default: { limit: DEMO_REQUEST_RATE_LIMIT, ttl: RATE_LIMIT_WINDOW_MS },
  })
  @Post('public/demo-requests')
  create(@Body() dto: CreateDemoRequestDto) {
    return this.demoRequests.create(dto);
  }

  // Leads' personal data: never for a demo admin.
  @Get('demo-requests')
  @Roles(UserRole.ADMIN)
  @UseGuards(RealAccountGuard)
  list() {
    return this.demoRequests.list();
  }
}
