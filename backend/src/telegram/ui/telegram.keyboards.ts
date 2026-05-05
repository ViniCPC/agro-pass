import { Markup } from 'telegraf';
import type { Farm } from '../../../generated/prisma/client';

export const PRODUCT_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback('Café', 'product:COFFEE'),
    Markup.button.callback('Soja', 'product:SOY'),
  ],
  [
    Markup.button.callback('Gado', 'product:CATTLE'),
    Markup.button.callback('Cacau', 'product:COCOA'),
  ],
  [Markup.button.callback('Óleo de palma', 'product:PALM_OIL')],
  [
    Markup.button.callback('Borracha', 'product:RUBBER'),
    Markup.button.callback('Madeira', 'product:WOOD'),
  ],
]);

export const CONFIRM_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback('Confirmar', 'confirm:yes'),
    Markup.button.callback('Cancelar', 'confirm:no'),
  ],
]);

export function buildFarmKeyboard(farms: Farm[]) {
  return Markup.inlineKeyboard(
    farms.map((farm) => [Markup.button.callback(farm.name, `farm:${farm.id}`)]),
  );
}

export function buildQrKeyboard(publicBatchUrl: string) {
  return Markup.inlineKeyboard([
    [Markup.button.url('Ver lote público', publicBatchUrl)],
  ]);
}
