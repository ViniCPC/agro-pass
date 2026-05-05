import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BatchesModule } from './batches/batches.module';
import { FarmsModule } from './farms/farms.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProducersModule } from './producers/producers.module';
import { TraceEventsModule } from './trace-events/trace-events.module';
import { TelegramModule } from './telegram/telegram.module';
import { PublicBatchesModule } from './public-batches/public-batches.module';
import { EudrModule } from './eudr/eudr.module';
import { CooperativesModule } from './cooperatives/cooperatives.module';

@Module({
  imports: [
    PrismaModule,
    ProducersModule,
    FarmsModule,
    BatchesModule,
    TraceEventsModule,
    TelegramModule,
    PublicBatchesModule,
    EudrModule,
    CooperativesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
