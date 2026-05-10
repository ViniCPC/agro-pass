import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { BotContext } from './telegram.types';
import { TelegramRouter } from './telegram.router';

@Injectable()
export class TelegramBootstrapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBootstrapService.name);
  private bot?: Telegraf<BotContext>;

  constructor(private readonly router: TelegramRouter) {}

  async onModuleInit() {
    const enabled = process.env.TELEGRAM_ENABLED !== 'false';
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!enabled || !token) {
      this.logger.warn('Bot do Telegram desabilitado (TELEGRAM_ENABLED=false ou token ausente).');
      return;
    }

    this.bot = new Telegraf<BotContext>(token);
    this.router.register(this.bot);
    this.bot.launch().catch((error) => {
      this.logger.error('Bot crashed', error);
    });
    this.logger.log('Bot do Telegram iniciado (long polling).');
  }

  async onModuleDestroy() {
    this.bot?.stop('Aplicação Nest encerrada');
  }
}
