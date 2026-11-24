import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BatchesModule } from './batches/batches.module';
import { FarmsModule } from './farms/farms.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProducersModule } from './producers/producers.module';
import { TraceEventsModule } from './trace-events/trace-events.module';
import { PublicBatchesModule } from './public-batches/public-batches.module';
import { CooperativesModule } from './cooperatives/cooperatives.module';
import { HealthModule } from './health/health.module';
import { DemoRequestsModule } from './demo-requests/demo-requests.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { DEFAULT_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from './common/rate-limit';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: RATE_LIMIT_WINDOW_MS, limit: DEFAULT_RATE_LIMIT },
    ]),
    PrismaModule,
    AuthModule,
    ProducersModule,
    FarmsModule,
    BatchesModule,
    TraceEventsModule,
    PublicBatchesModule,
    CooperativesModule,
    HealthModule,
    DemoRequestsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guards run in this order: abusive traffic is cut before auth work.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
