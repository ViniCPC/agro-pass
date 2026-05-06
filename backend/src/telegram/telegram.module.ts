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
import { RegisterFarmScene } from './scenes/register-farm.scene';
import { TelegramAccountService } from './services/telegram-account.service';
import { TelegramHarvestService } from './services/telegram-harvest.service';
import { TelegramFarmService } from './services/telegram-farm.service';
import { GeminiService } from './gemini/gemini.service';
import { GeminiDispatcherService } from './gemini/gemini-dispatcher.service';
import { AiModule } from 'src/ai/ai.module';
import { FarmsModule } from '../farms/farms.module';
import { EudrModule } from '../eudr/eudr.module';

@Module({
  imports: [
    PrismaModule,
    BatchesModule,
    CooperativesModule,
    SolanaModule,
    QrModule,
    AiModule,
    FarmsModule,
    EudrModule,
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
    RegisterFarmScene,
    HarvestFlowService,
    TelegramAccountService,
    TelegramHarvestService,
    TelegramFarmService,
    GeminiService,
    GeminiDispatcherService,
  ],
})
export class TelegramModule {}
