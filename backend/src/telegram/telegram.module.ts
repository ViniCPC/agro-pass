import { Module } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaModule } from '../prisma/prisma.module';
import { BatchesModule } from '../batches/batches.module';
import { CooperativesModule } from '../cooperatives/cooperatives.module';
import { QrModule } from '../qr/qr.module';
import { SolanaModule } from '../solana/solana.module';
import { TelegramBootstrapService } from './telegram.bootstrap.service';
import { TelegramRouter } from './telegram.router';
import { HarvestFlowService } from './flows/harvest.flow';
import { LinkAccountScene } from './scenes/link-account.scene';
import { HarvestScene } from './scenes/harvest.scene';
import { TelegramAccountService } from './services/telegram-account.service';
import { TelegramHarvestService } from './services/telegram-harvest.service';
import { GeminiService } from './gemini/gemini.service';
import { GeminiDispatcherService } from './gemini/gemini-dispatcher.service';

@Module({
  imports: [
    PrismaModule,
    BatchesModule,
    CooperativesModule,
    SolanaModule,
    QrModule,
  ],
  providers: [
    {
      provide: 'GEMINI_AI',
      useFactory: () =>
        new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? ''),
    },
    TelegramBootstrapService,
    TelegramRouter,
    LinkAccountScene,
    HarvestScene,
    HarvestFlowService,
    TelegramAccountService,
    TelegramHarvestService,
    GeminiService,
    GeminiDispatcherService,
  ],
})
export class TelegramModule {}
