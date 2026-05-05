import type { ProductType } from '../../../generated/prisma/enums';

export const PRODUCT_LABELS: Record<ProductType, string> = {
  COFFEE: 'Café',
  SOY: 'Soja',
  CATTLE: 'Gado',
  COCOA: 'Cacau',
  PALM_OIL: 'Óleo de palma',
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
  welcome:
    'Bem-vindo ao AgroPass!\n\n' +
    'Eu ajudo produtores e cooperativas a criarem lotes rastreáveis com validação ambiental e prova digital de origem.\n\n' +
    'Comandos:\n' +
    '/linkar - vincular sua conta por telefone\n' +
    '/colheita - cadastrar novo lote\n' +
    '/ajuda - ver todos os comandos\n' +
    '/cancelar - cancelar operação atual',

  help:
    'Comandos disponíveis:\n\n' +
    '/linkar - vincular sua conta AgroPass por telefone\n' +
    '/colheita - cadastrar um lote de colheita\n' +
    '/cancelar - cancelar a operação atual\n' +
    '/ajuda - exibir esta mensagem',

  cancelled: 'Operação cancelada. Use /ajuda para ver os comandos disponíveis.',
  notLinked:
    'Conta não vinculada. Use /linkar ou o link da sua cooperativa primeiro.',
  unknownCommand:
    'Comando não reconhecido. Use /ajuda para ver os comandos disponíveis.',
  qrReady: (publicBatchUrl: string) =>
    'Acesse o lote público por este link:\n' + publicBatchUrl,
  qrNotFound:
    'Não consegui localizar o lote desse botão. Gere um novo lote com /colheita.',
  globalError: 'Ops, algo deu errado. Tente novamente ou use /cancelar.',

  cooperative: {
    detected: (name: string) =>
      `Cooperativa identificada: ${name}\n\n` +
      'Para conectar seu cadastro, envie seu CPF ou CNPJ.',

    askDocument:
      'Envie seu CPF ou CNPJ para eu localizar seu cadastro na cooperativa.\n\n' +
      'Digite apenas números, se preferir.',

    invalidLink:
      'Link de cooperativa inválido ou expirado.\n\n' +
      'Peça um novo link para sua cooperativa.',

    invalidDocument:
      'CPF/CNPJ inválido. Envie 11 dígitos para CPF ou 14 dígitos para CNPJ.',

    producerLinked: (name: string) =>
      `Cadastro encontrado, ${name}!\n\n` +
      'Agora você pode registrar colheitas e gerar passaportes digitais dos seus lotes.',

    producerNotFound:
      'Não encontrei seu cadastro nessa cooperativa.\n\n' +
      'Confira o CPF/CNPJ ou fale com a sua cooperativa para ser importado no sistema.',

    alreadyLinked:
      'Este cadastro já está vinculado a outra conta do Telegram.\n\n' +
      'Entre em contato com a cooperativa para revisar o vínculo.',
  },

  link: {
    askPhone:
      'Digite o telefone cadastrado no sistema, somente números, com DDD.\n\n' +
      'Exemplo: 31999990001\n\n' +
      'Use /cancelar para sair.',

    noFromId:
      'Não foi possível identificar seu usuário no Telegram. Tente novamente.',
    notText: 'Digite o telefone como texto. Tente novamente ou use /cancelar.',
    invalidFormat:
      'Telefone inválido. Digite com DDD, 10 ou 11 dígitos, sem espaços ou traços.\n\n' +
      'Tente novamente.',
    notFound:
      'Nenhum produtor encontrado com esse telefone.\n\n' +
      'Verifique se o número está igual ao cadastrado no sistema.',
    ambiguous:
      'Mais de um cadastro encontrado com esse telefone. Entre em contato com o suporte.',
    phoneConflict:
      'Este telefone já está vinculado a outra conta do Telegram.\n\n' +
      'Entre em contato com o suporte.',

    alreadyLinked: (name: string) =>
      `Conta de ${name} já está vinculada a este Telegram.\n\n` +
      'Use /colheita para cadastrar um lote.',

    telegramConflict: (existingName: string) =>
      `Seu Telegram já está vinculado ao produtor ${existingName}.\n\n` +
      'Entre em contato com o suporte para alterar o vínculo.',

    success: (name: string) =>
      `Conta de ${name} vinculada com sucesso!\n\n` +
      'Use /colheita para cadastrar um novo lote.',

    error: 'Erro ao processar vínculo. Tente novamente ou use /cancelar.',
  },

  gemini: {
    notLinked:
      'Você precisa vincular sua conta antes de conversar comigo.\n\n' +
      'Use /linkar para fazer isso.',
    notConfigured:
      'A conversa inteligente ainda não está configurada.\n\n' +
      'Use /colheita para cadastrar um lote.',
    error:
      'Não consegui processar sua mensagem agora. Tente novamente ou use /ajuda.',
  },

  harvest: {
    askProduct: 'Qual é a cultura do lote?\n\nUse /cancelar para sair.',
    chooseProductButton: 'Escolha uma cultura usando os botões acima.',
    selectFarm: 'Selecione uma fazenda com validação EUDR COMPLIANT:',
    chooseFarmButton: 'Selecione uma fazenda usando os botões acima.',

    noFarms:
      'Você não possui fazenda cadastrada no sistema.\n\n' +
      'Cadastre uma fazenda antes de criar lotes.',

    noCompliantFarms:
      'Nenhuma fazenda aprovada para criar lote.\n\n' +
      'Para gerar um lote, a fazenda precisa ter validação EUDR com status COMPLIANT.',

    farmNotOwned: 'Fazenda não encontrada ou não pertence à sua conta.',

    farmNotCompliant:
      'Esta fazenda ainda não possui validação EUDR aprovada.\n\n' +
      'Valide a fazenda antes de criar um lote.',

    askQuantity: (unit: string) =>
      `Quantas ${unit}?\n\nDigite um número inteiro. Exemplo: 120`,

    invalidQuantity:
      'Quantidade inválida. Digite um número inteiro positivo. Exemplo: 120\n\n' +
      'Use /cancelar para sair.',

    confirmPrompt: (
      productType: ProductType,
      farmName: string,
      quantity: number,
    ) =>
      'Confirma o cadastro do lote?\n\n' +
      `Cultura: ${PRODUCT_LABELS[productType]}\n` +
      `Fazenda: ${farmName}\n` +
      `Quantidade: ${quantity} ${UNIT_BY_PRODUCT[productType]}\n` +
      'Status EUDR: COMPLIANT',

    confirmButton: 'Use os botões acima para confirmar ou cancelar.',
    cancelledHarvest:
      'Cadastro cancelado. Use /colheita para tentar novamente.',
    incomplete: 'Dados incompletos. Use /colheita para reiniciar.',

    creating: 'Criando lote e preparando o passaporte digital...',

    minting:
      'Gerando o passaporte digital do lote na Solana.\n\n' +
      'Aguarde enquanto registramos a prova digital de origem.',

    generatingQr: 'Gerando QR Code e PDF público do lote...',

    success: (code: string, productType: ProductType, quantity: number) =>
      'Lote cadastrado com sucesso!\n\n' +
      `Código: ${code}\n` +
      `Cultura: ${PRODUCT_LABELS[productType]}\n` +
      `Quantidade: ${quantity} ${UNIT_BY_PRODUCT[productType]}\n\n` +
      'Seu passaporte digital foi gerado com QR Code e cNFT.',

    successWithLinks: (params: {
      code: string;
      productType: ProductType;
      quantity: number;
      publicUrl: string;
      qrPdfUrl?: string;
      mintTxHash?: string;
    }) =>
      'Lote cadastrado com sucesso!\n\n' +
      `Código: ${params.code}\n` +
      `Cultura: ${PRODUCT_LABELS[params.productType]}\n` +
      `Quantidade: ${params.quantity} ${UNIT_BY_PRODUCT[params.productType]}\n\n` +
      `Rastreabilidade: ${params.publicUrl}\n` +
      (params.qrPdfUrl ? `QR PDF: ${params.qrPdfUrl}\n` : '') +
      (params.mintTxHash ? `TX Solana: ${params.mintTxHash}\n` : ''),

    error: 'Erro ao cadastrar lote. Tente novamente ou use /cancelar.',
  },
};
