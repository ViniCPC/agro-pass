import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProducersModule } from './producers/producers.module';

@Module({
  imports: [PrismaModule, ProducersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
