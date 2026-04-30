import type { ProductType } from '../../../generated/prisma/enums';

export const PRODUCT_LABELS: Record<ProductType, string> = {
  COFFEE: 'Café',
  SOY: 'Soja',
  CATTLE: 'Gado',
  COCOA: 'Cacau',
  PALM_OIL: 'Óleo de Palma',
  RUBBER: 'Borracha',
  WOOD: 'Madeira',
};

export const UNIT_BY_PRODUCT: Record<ProductType, string> = {
  COFFEE: 'sacas',
  SOY: 'sacas',
  CATTLE: 'cabeças',
  COCOA: 'sacas',
  PALM_OIL: 'toneladas',
  RUBBER: 'kg',
  WOOD: 'm³',
};

export const Msg = {
  // ── Global ──────────────────────────────────────
  welcome:
    'Olá! Sou o bot do AgroPass.\n\n' +
    'Comandos:\n' +
    '/linkar — vincular sua conta\n' +
    '/colheita — cadastrar novo lote\n' +
    '/ajuda — ver todos os comandos\n' +
    '/cancelar — cancelar operação atual',

  help:
    'Comandos disponíveis:\n\n' +
    '/linkar — vincular telefone à conta AgroPass\n' +
    '/colheita — cadastrar um lote de colheita\n' +
    '/cancelar — cancelar a operação atual\n' +
    '/ajuda — exibir esta mensagem',

  cancelled: 'Operação cancelada. Use /ajuda para ver os comandos disponíveis.',
  notLinked: 'Conta não vinculada. Use /linkar primeiro.',
  qrReady: (publicBatchUrl: string) =>
    'Acesse o lote público por este link:\n' + publicBatchUrl,
  qrNotFound:
    'Não consegui localizar o lote desse botão. Gere um novo lote com /colheita.',
  globalError: 'Ops, algo deu errado. Tente novamente ou use /cancelar.',

  // ── Cena: linkAccount ────────────────────────────
  link: {
    askPhone:
      'Digite o telefone cadastrado no sistema (somente números, com DDD).\n' +
      'Exemplo: 31999990001\n\n' +
      'Use /cancelar para sair.',

    noFromId: 'Não foi possível identificar seu usuário no Telegram. Tente novamente.',
    notText: 'Digite o telefone como texto. Tente novamente ou use /cancelar.',
    invalidFormat:
      'Telefone inválido. Digite com DDD, 10 ou 11 dígitos (sem espaços ou traços).\n' +
      'Tente novamente.',
    notFound:
      'Nenhum produtor encontrado com esse telefone.\n' +
      'Verifique se o número está igual ao cadastrado no sistema.',
    ambiguous:
      'Mais de um cadastro encontrado com esse telefone. Entre em contato com o suporte.',
    phoneConflict:
      'Este telefone já está vinculado a outra conta do Telegram.\n' +
      'Entre em contato com o suporte.',

    alreadyLinked: (name: string) =>
      `Conta de ${name} já está vinculada a este Telegram.\n\n` +
      'Use /colheita para cadastrar um lote.',

    telegramConflict: (existingName: string) =>
      `Seu Telegram já está vinculado ao produtor ${existingName}.\n` +
      'Entre em contato com o suporte para alterar o vínculo.',

    success: (name: string) =>
      `Conta de ${name} vinculada com sucesso!\n\nUse /colheita para cadastrar um novo lote.`,

    error: 'Erro ao processar vínculo. Tente novamente ou use /cancelar.',
  },

  // ── Cena: harvest ────────────────────────────────
  harvest: {
    askProduct: 'Qual é a cultura do lote?\n\nUse /cancelar para sair.',
    chooseProductButton: 'Escolha uma cultura usando os botões acima.',
    selectFarm: 'Selecione a fazenda:',
    chooseFarmButton: 'Selecione uma fazenda usando os botões acima.',
    noFarms:
      'Você não possui fazenda cadastrada no sistema.\n' +
      'Cadastre uma fazenda antes de criar lotes.',
    farmNotOwned: 'Fazenda não encontrada ou não pertence à sua conta.',

    askQuantity: (unit: string) =>
      `Quantas ${unit}?\n\nDigite um número inteiro. Exemplo: 120`,

    invalidQuantity:
      'Quantidade inválida. Digite um número inteiro positivo. Exemplo: 120\n\n' +
      'Use /cancelar para sair.',

    confirmPrompt: (productType: ProductType, farmName: string, quantity: number) =>
      'Confirma o cadastro do lote?\n\n' +
      `Cultura: ${PRODUCT_LABELS[productType]}\n` +
      `Fazenda: ${farmName}\n` +
      `Quantidade: ${quantity} ${UNIT_BY_PRODUCT[productType]}`,

    confirmButton: 'Use os botões acima para confirmar ou cancelar.',
    cancelledHarvest: 'Cadastro cancelado. Use /colheita para tentar novamente.',
    incomplete: 'Dados incompletos. Use /colheita para reiniciar.',

    success: (code: string, productType: ProductType, quantity: number) =>
      'Lote cadastrado com sucesso!\n\n' +
      `Código: ${code}\n` +
      `Cultura: ${PRODUCT_LABELS[productType]}\n` +
      `Quantidade: ${quantity} ${UNIT_BY_PRODUCT[productType]}`,

    error: 'Erro ao cadastrar lote. Tente novamente ou use /cancelar.',
  },
};
