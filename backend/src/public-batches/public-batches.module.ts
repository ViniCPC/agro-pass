import { Module } from '@nestjs/common';
import { PublicBatchesController } from './public-batches.controller';
import { PublicBatchesService } from './public-batches.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicBatchesController],
  providers: [PublicBatchesService],
})
export class PublicBatchesModule {}