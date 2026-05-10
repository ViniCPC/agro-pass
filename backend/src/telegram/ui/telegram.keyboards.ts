import { Markup } from 'telegraf';
import type { Farm } from '../../../generated/prisma/client';

type BatchSummary = { id: string; code: string; quantity: number; unit: string };

export const DOCUMENT_TYPE_KEYBOARD = Markup.inlineKeyboard([
  [Markup.button.callback('Nota fiscal', 'doctype:INVOICE')],
  [Markup.button.callback('Recibo de armazém', 'doctype:WAREHOUSE_RECEIPT')],
  [Markup.button.callback('Relatório ambiental', 'doctype:ENVIRONMENTAL_REPORT')],
  [Markup.button.callback('Outro documento', 'doctype:OTHER')],
]);

export function buildBatchKeyboard(batches: BatchSummary[]) {
  return Markup.inlineKeyboard(
    batches.map((b) => [
      Markup.button.callback(`${b.code} — ${b.quantity} ${b.unit}`, `batch:${b.id}`),
    ]),
  );
}

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

export const ADD_STAGE_AFTER_HARVEST_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback('Sim, adicionar etapa', 'harvest:add_stage:yes'),
    Markup.button.callback('Nao, finalizar', 'harvest:add_stage:no'),
  ],
]);

export const STAGE_ADD_MORE_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback('Sim', 'stage:add_more:yes'),
    Markup.button.callback('Nao', 'stage:add_more:no'),
  ],
]);

export const STAGE_SKIP_DOCUMENT_KEYBOARD = Markup.inlineKeyboard([
  [Markup.button.callback('Pular comprovante', 'stage:skip_document')],
]);

export const FARM_CAR_RETRY_KEYBOARD = Markup.inlineKeyboard([
  [Markup.button.callback('Digitar manualmente', 'farm_manual_input')],
  [Markup.button.callback('Enviar outra foto', 'farm_send_another_car_photo')],
]);

export const FARM_CAR_CONFIRM_KEYBOARD = Markup.inlineKeyboard([
  [Markup.button.callback('Confirmar dados', 'farm_confirm_car_data')],
  [Markup.button.callback('Corrigir manualmente', 'farm_manual_input')],
  [Markup.button.callback('Enviar outra foto', 'farm_send_another_car_photo')],
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
