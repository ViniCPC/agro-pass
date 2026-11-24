import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Readiness: the application and its database.
  @Get()
  async check(@Res({ passthrough: true }) response: Response) {
    const result = await this.healthService.check();

    // Only the database makes the API unavailable. Solana being down is
    // reported as "degraded": passports keep working and proofs are retried.
    if (result.services.database.status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result;
  }

  // Liveness: the process answers. Used by the platform to decide restarts,
  // so it must not depend on the database (restarting would not fix it).
  @Get('live')
  live() {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }
}
