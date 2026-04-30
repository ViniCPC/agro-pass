import { Context, Scenes } from 'telegraf';
import { ProductType } from '../../generated/prisma/client';

export interface WizardState {
  productType?: ProductType;
  producerId?: string;
  farmId?: string;
  quantity?: number;
}

export type BotContext = Context & Scenes.WizardContext;

export function wizardState(ctx: BotContext): WizardState {
  return ctx.wizard.state as WizardState;
}

export function extractTelegramId(ctx: BotContext): string | null {
  const id = ctx.from?.id;
  return id != null ? String(id) : null;
}

export function extractText(ctx: BotContext): string | null {
  if (!ctx.message || !('text' in ctx.message)) return null;
  const text = ctx.message.text.trim();
  return text || null;
}

export function extractCallbackData(ctx: BotContext): string | null {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return null;
  return ctx.callbackQuery.data || null;
}
