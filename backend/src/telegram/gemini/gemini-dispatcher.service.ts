import { Injectable, Logger } from '@nestjs/common';
import type { ProductType } from '../../../generated/prisma/enums';
import { TelegramHarvestService } from '../services/telegram-harvest.service';

export interface DispatchContext {
  telegramUserId: string;
  producerId: string;
}

const VALID_PRODUCT_TYPES = new Set([
  'COFFEE', 'SOY', 'CATTLE', 'COCOA', 'PALM_OIL', 'RUBBER', 'WOOD',
]);

@Injectable()
export class GeminiDispatcherService {
  private readonly logger = new Logger(GeminiDispatcherService.name);

  constructor(private readonly harvestService: TelegramHarvestService) {}

  async dispatch(
    functionName: string,
    args: Record<string, unknown>,
    context: DispatchContext,
  ): Promise<string> {
    try {
      switch (functionName) {
        case 'listar_fazendas':
          return await this.listFarms(context.producerId);
        case 'criar_lote':
          return await this.createBatch(args, context.producerId);
        default:
          return JSON.stringify({ error: `Função desconhecida: ${functionName}` });
      }
    } catch (error) {
      this.logger.error(`Erro ao executar função ${functionName}`, error);
      return JSON.stringify({ error: 'Erro interno ao executar a ação. Tente novamente.' });
    }
  }

  private async listFarms(producerId: string): Promise<string> {
    const farms = await this.harvestService.getFarmsForProducer(producerId);
    return JSON.stringify({
      farms: farms.map((f) => ({ id: f.id, name: f.name, city: f.city, state: f.state })),
    });
  }

  private async createBatch(
    args: Record<string, unknown>,
    producerId: string,
  ): Promise<string> {
    const { farmId, productType, quantity: rawQuantity } = args;

    if (typeof farmId !== 'string' || !farmId) {
      return JSON.stringify({ error: 'farmId ausente ou inválido.' });
    }
    if (typeof productType !== 'string' || !VALID_PRODUCT_TYPES.has(productType)) {
      return JSON.stringify({ error: `productType inválido: ${productType}` });
    }

    const quantity = Math.round(Number(rawQuantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return JSON.stringify({ error: 'quantity deve ser um número inteiro positivo.' });
    }

    const farm = await this.harvestService.getFarmIfOwned(farmId, producerId);
    if (!farm) {
      return JSON.stringify({ error: 'Fazenda não encontrada ou não pertence à sua conta.' });
    }

    const batch = await this.harvestService.createBatch({
      productType: productType as ProductType,
      farmId,
      quantity,
    });

    return JSON.stringify({ success: true, batchCode: batch.code, quantity: batch.quantity });
  }
}
