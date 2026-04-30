import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BatchesModule } from '../batches/batches.module';
import { TelegramBootstrapService } from './telegram.bootstrap.service';
import { TelegramRouter } from './telegram.router';
import { LinkAccountScene } from './scenes/link-account.scene';
import { HarvestScene } from './scenes/harvest.scene';
import { TelegramAccountService } from './services/telegram-account.service';
import { TelegramHarvestService } from './services/telegram-harvest.service';

@Module({
  imports: [PrismaModule, BatchesModule],
  providers: [
    TelegramBootstrapService,
    TelegramRouter,
    LinkAccountScene,
    HarvestScene,
    TelegramAccountService,
    TelegramHarvestService,
  ],
})
export class TelegramModule {}
