import type { ProductType } from '../../../generated/prisma/enums';

export const PRODUCT_LABELS: Record<ProductType, string> = {
  COFFEE: 'Cafe',
  SOY: 'Soja',
  CATTLE: 'Gado',
  COCOA: 'Cacau',
  PALM_OIL: 'Oleo de palma',
  RUBBER: 'Borracha',
  WOOD: 'Madeira',
};

export const UNIT_BY_PRODUCT: Record<ProductType, string> = {
  COFFEE: 'sacas',
  SOY: 'sacas',
  CATTLE: 'cabecas',
  COCOA: 'sacas',
  PALM_OIL: 'toneladas',
  RUBBER: 'kg',
  WOOD: 'm3',
};

export const Msg = {
  welcome:
    'Bem-vindo ao AgroPass!\n\n' +
    'Eu ajudo produtores e cooperativas a criarem lotes rastreaveis com validacao ambiental e prova digital de origem.\n\n' +
    'Comandos:\n' +
    '/linkar - vincular sua conta por telefone\n' +
    '/fazenda - cadastrar fazenda com foto do CAR\n' +
    '/colheita - cadastrar novo lote\n' +
    '/ajuda - ver todos os comandos\n' +
    '/cancelar - cancelar operacao atual',

  help:
    'Comandos disponiveis:\n\n' +
    '/linkar - vincular sua conta AgroPass por telefone\n' +
    '/fazenda - cadastrar fazenda com foto do CAR\n' +
    '/colheita - cadastrar um lote de colheita\n' +
    '/cancelar - cancelar a operacao atual\n' +
    '/ajuda - exibir esta mensagem',

  cancelled: 'Operacao cancelada. Use /ajuda para ver os comandos disponiveis.',
  notLinked:
    'Conta nao vinculada. Use /linkar ou o link da sua cooperativa primeiro.',
  unknownCommand:
    'Comando nao reconhecido. Use /ajuda para ver os comandos disponiveis.',
  qrReady: (publicBatchUrl: string) =>
    'Acesse o lote publico por este link:\n' + publicBatchUrl,
  qrNotFound:
    'Nao consegui localizar o lote desse botao. Gere um novo lote com /colheita.',
  globalError: 'Ops, algo deu errado. Tente novamente ou use /cancelar.',

  cooperative: {
    detected: (name: string) =>
      `Cooperativa identificada: ${name}\n\n` +
      'Para conectar seu cadastro, envie seu CPF ou CNPJ.',

    askDocument:
      'Envie seu CPF ou CNPJ para eu localizar seu cadastro na cooperativa.\n\n' +
      'Digite apenas numeros, se preferir.',

    invalidLink:
      'Link de cooperativa invalido ou expirado.\n\n' +
      'Peca um novo link para sua cooperativa.',

    invalidDocument:
      'CPF/CNPJ invalido. Envie 11 digitos para CPF ou 14 digitos para CNPJ.',

    producerLinked: (name: string) =>
      `Cadastro encontrado, ${name}!\n\n` +
      'Agora voce pode registrar colheitas e gerar passaportes digitais dos seus lotes.',

    producerNotFound:
      'Nao encontrei seu cadastro nessa cooperativa.\n\n' +
      'Confira o CPF/CNPJ ou fale com a sua cooperativa para ser importado no sistema.',

    alreadyLinked:
      'Este cadastro ja esta vinculado a outra conta do Telegram.\n\n' +
      'Entre em contato com a cooperativa para revisar o vinculo.',
  },

  link: {
    askPhone:
      'Digite o telefone cadastrado no sistema, somente numeros, com DDD.\n\n' +
      'Exemplo: 31999990001\n\n' +
      'Use /cancelar para sair.',

    noFromId:
      'Nao foi possivel identificar seu usuario no Telegram. Tente novamente.',
    notText: 'Digite o telefone como texto. Tente novamente ou use /cancelar.',
    invalidFormat:
      'Telefone invalido. Digite com DDD, 10 ou 11 digitos, sem espacos ou tracos.\n\n' +
      'Tente novamente.',
    notFound:
      'Nenhum produtor encontrado com esse telefone.\n\n' +
      'Verifique se o numero esta igual ao cadastrado no sistema.',
    ambiguous:
      'Mais de um cadastro encontrado com esse telefone. Entre em contato com o suporte.',
    phoneConflict:
      'Este telefone ja esta vinculado a outra conta do Telegram.\n\n' +
      'Entre em contato com o suporte.',

    alreadyLinked: (name: string) =>
      `Conta de ${name} ja esta vinculada a este Telegram.\n\n` +
      'Use /colheita para cadastrar um lote.',

    telegramConflict: (existingName: string) =>
      `Seu Telegram ja esta vinculado ao produtor ${existingName}.\n\n` +
      'Entre em contato com o suporte para alterar o vinculo.',

    success: (name: string) =>
      `Conta de ${name} vinculada com sucesso!\n\n` +
      'Use /colheita para cadastrar um novo lote.',

    error: 'Erro ao processar vinculo. Tente novamente ou use /cancelar.',
  },

  gemini: {
    notLinked:
      'Voce precisa vincular sua conta antes de conversar comigo.\n\n' +
      'Use /linkar para fazer isso.',
    notConfigured:
      'A conversa inteligente ainda nao esta configurada.\n\n' +
      'Use /colheita para cadastrar um lote.',
    error:
      'Nao consegui processar sua mensagem agora. Tente novamente ou use /ajuda.',
  },

  farmRegistration: {
    askCarPhoto:
      'Envie uma foto legivel do CAR para eu extrair os dados e cadastrar sua fazenda.',
    readingCar: 'Recebi a imagem. Vou tentar ler os dados do CAR...',
    lowConfidence:
      'Nao consegui ler com clareza. Envie outra foto mais nitida ou tente manualmente depois.',
    noPendingDraft:
      'Nao encontrei dados pendentes. Envie a foto do CAR novamente.',
    draftExpired:
      'Seu rascunho expirou. Envie a foto do CAR novamente para continuar.',
    confirmButtonsHint: 'Os dados estao corretos?',
    manualInputPending:
      'Entrada manual ainda nao foi implementada neste fluxo. Envie outra foto do CAR.',
    createdAndValidating:
      'Dados confirmados. Fazenda cadastrada e validacao EUDR iniciada automaticamente.',
    eudrValidationWarning:
      'Fazenda cadastrada, mas a validacao EUDR falhou neste momento. Tente validar novamente no painel.',
  },

  harvest: {
    askProduct: 'Qual e a cultura do lote?\n\nUse /cancelar para sair.',
    chooseProductButton: 'Escolha uma cultura usando os botoes acima.',
    selectFarm: 'Selecione uma fazenda com validacao EUDR COMPLIANT:',
    chooseFarmButton: 'Selecione uma fazenda usando os botoes acima.',

    noFarms:
      'Voce nao possui fazenda cadastrada no sistema.\n\n' +
      'Cadastre uma fazenda antes de criar lotes.',

    noCompliantFarms:
      'Nenhuma fazenda aprovada para criar lote.\n\n' +
      'Para gerar um lote, a fazenda precisa ter validacao EUDR com status COMPLIANT.',

    farmNotOwned: 'Fazenda nao encontrada ou nao pertence a sua conta.',

    farmNotCompliant:
      'Esta fazenda ainda nao possui validacao EUDR aprovada.\n\n' +
      'Valide a fazenda antes de criar um lote.',

    askQuantity: (unit: string) =>
      `Quantas ${unit}?\n\nDigite um numero inteiro. Exemplo: 120`,

    invalidQuantity:
      'Quantidade invalida. Digite um numero inteiro positivo. Exemplo: 120\n\n' +
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

    confirmButton: 'Use os botoes acima para confirmar ou cancelar.',
    cancelledHarvest:
      'Cadastro cancelado. Use /colheita para tentar novamente.',
    incomplete: 'Dados incompletos. Use /colheita para reiniciar.',

    creating: 'Criando lote e preparando o passaporte digital...',

    minting:
      'Gerando o passaporte digital do lote na Solana.\n\n' +
      'Aguarde enquanto registramos a prova digital de origem.',

    generatingQr: 'Gerando QR Code e PDF publico do lote...',

    success: (code: string, productType: ProductType, quantity: number) =>
      'Lote cadastrado com sucesso!\n\n' +
      `Codigo: ${code}\n` +
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
      `Codigo: ${params.code}\n` +
      `Cultura: ${PRODUCT_LABELS[params.productType]}\n` +
      `Quantidade: ${params.quantity} ${UNIT_BY_PRODUCT[params.productType]}\n\n` +
      `Rastreabilidade: ${params.publicUrl}\n` +
      (params.qrPdfUrl ? `QR PDF: ${params.qrPdfUrl}\n` : '') +
      (params.mintTxHash ? `TX Solana: ${params.mintTxHash}\n` : ''),

    error: 'Erro ao cadastrar lote. Tente novamente ou use /cancelar.',
  },
};
