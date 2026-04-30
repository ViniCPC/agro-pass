import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BatchesModule } from './batches/batches.module';
import { FarmsModule } from './farms/farms.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProducersModule } from './producers/producers.module';
import { TraceEventsModule } from './trace-events/trace-events.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [PrismaModule, ProducersModule, FarmsModule, BatchesModule, TraceEventsModule, TelegramModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
