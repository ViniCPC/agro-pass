import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProducersController } from './producers.controller';
import { ProducersService } from './producers.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProducersController],
  providers: [ProducersService],
})
export class ProducersModule {}
