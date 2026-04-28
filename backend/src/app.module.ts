import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BatchesModule } from './batches/batches.module';
import { FarmsModule } from './farms/farms.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProducersModule } from './producers/producers.module';

@Module({
  imports: [PrismaModule, ProducersModule, FarmsModule, BatchesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
