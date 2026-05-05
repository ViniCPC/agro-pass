import { Module } from '@nestjs/common';
import { BubblegumService } from './bubblegum/bubblegum.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BubblegumService],
  exports: [BubblegumService],
})
export class SolanaModule {}
