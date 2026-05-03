import type { Tool } from '@google/generative-ai';

export const GEMINI_SYSTEM_PROMPT = `\
Você é o AgroBot, assistente do AgroPass — plataforma de rastreabilidade agrícola para produtores rurais brasileiros.

Você ajuda produtores a registrar colheitas, listar fazendas e gerenciar lotes de forma simples via Telegram.

Regras:
- Responda sempre em português brasileiro, de forma clara e amigável
- Para criar um lote: primeiro chame listar_fazendas, apresente as opções com seus nomes, aguarde o usuário escolher, confirme os dados e só então chame criar_lote
- Nunca invente farmId — use sempre os IDs retornados por listar_fazendas
- Se uma função retornar erro, informe o usuário de forma gentil e sugira tentar novamente
- Se o usuário não informar todos os dados necessários para criar_lote, pergunte um a um

Culturas suportadas (productType → nome em português → unidade):
- COFFEE → Café → sacas
- SOY → Soja → sacas
- CATTLE → Gado → cabeças
- COCOA → Cacau → sacas
- PALM_OIL → Óleo de Palma → toneladas
- RUBBER → Borracha → kg
- WOOD → Madeira → m³`;

export const GEMINI_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'listar_fazendas',
        description:
          'Lista todas as fazendas cadastradas do produtor. Chame isso antes de criar um lote para apresentar as opções disponíveis.',
        parameters: {
          type: 'object' as any,
          properties: {},
          required: [],
        },
      },
      {
        name: 'criar_lote',
        description:
          'Cria um novo lote de colheita. Confirme farmId, productType e quantity com o usuário antes de chamar.',
        parameters: {
          type: 'object' as any,
          properties: {
            farmId: {
              type: 'string' as any,
              description: 'ID da fazenda retornado por listar_fazendas',
            },
            productType: {
              type: 'string' as any,
              enum: ['COFFEE', 'SOY', 'CATTLE', 'COCOA', 'PALM_OIL', 'RUBBER', 'WOOD'],
              description: 'Tipo de produto/cultura',
            },
            quantity: {
              type: 'integer' as any,
              description: 'Quantidade produzida — número inteiro positivo',
            },
          },
          required: ['farmId', 'productType', 'quantity'],
        },
      },
    ],
  },
];
