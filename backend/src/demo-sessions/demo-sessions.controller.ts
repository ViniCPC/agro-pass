import { Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { DemoSessionsService } from './demo-sessions.service';

function readPositive(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Per client IP. Each visit creates rows (and, on closing, a devnet proof).
const DEMO_SESSION_LIMIT = readPositive(process.env.DEMO_SESSION_RATE_LIMIT, 5);
const DEMO_SESSION_WINDOW_MS = 10 * 60 * 1000;

@Controller('auth')
export class DemoSessionsController {
  constructor(private readonly demoSessions: DemoSessionsService) {}

  // "Entrar na demo": no sign-up, an isolated visit that expires on its own.
  @Public()
  @Throttle({
    default: { limit: DEMO_SESSION_LIMIT, ttl: DEMO_SESSION_WINDOW_MS },
  })
  @Post('demo')
  create() {
    return this.demoSessions.create();
  }
}
