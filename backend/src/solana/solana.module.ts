import { Module } from '@nestjs/common';
import { BubblegumService } from './bubblegum/bubblegum.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventChainModule } from '../event-chain/event-chain.module';

@Module({
  imports: [PrismaModule, EventChainModule],
  providers: [BubblegumService],
  exports: [BubblegumService],
})
export class SolanaModule {}
