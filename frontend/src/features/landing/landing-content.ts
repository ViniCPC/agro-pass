import type { BatchStatus } from '@/types/api'

// All landing page copy in one place, so wording changes never touch layout.

export const NAV_ITEMS = [
  { hash: '#produto', label: 'Produto' },
  { hash: '#como-funciona', label: 'Como funciona' },
  { hash: '#para-quem', label: 'Para quem é' },
  { hash: '#seguranca', label: 'Segurança' },
  { hash: '#faq', label: 'Perguntas frequentes' },
] as const

export const HERO = {
  title: 'A trajetória completa do seu produto, do campo ao destino.',
  subtitle:
    'Registre a origem, os responsáveis, os documentos e cada movimentação do lote em um passaporte digital que pode ser consultado por QR Code.',
  trust: ['Sem instalação', 'Acesso pelo navegador', 'Funciona no celular'],
}

export const BENEFITS = {
  title: 'Todas as informações do lote em um só lugar',
  items: [
    {
      title: 'Origem identificada',
      text: 'Associe cada lote ao produtor e à propriedade de origem.',
    },
    {
      title: 'Histórico completo',
      text: 'Registre colheita, recebimento, processamento, transporte e entrega.',
    },
    {
      title: 'Compartilhamento simples',
      text: 'Gere um QR Code para compradores, parceiros e consumidores consultarem a trajetória.',
    },
  ],
}

// How each lifecycle stage reads on the landing timeline.
export const STAGE_COPY: Record<BatchStatus, { done: string; pending: string }> = {
  CREATED: { done: 'Lote criado pelo produtor', pending: 'Criação do lote' },
  HARVESTED: { done: 'Colheita registrada', pending: 'Colheita' },
  RECEIVED: {
    done: 'Recebimento confirmado pela cooperativa',
    pending: 'Recebimento pela cooperativa',
  },
  IN_TRANSIT: { done: 'Transporte iniciado', pending: 'Transporte' },
  PROCESSED: { done: 'Processamento concluído', pending: 'Processamento' },
  DELIVERED: { done: 'Entrega confirmada', pending: 'Entrega aguardando confirmação' },
  CLOSED: { done: 'Lote encerrado com prova final', pending: 'Encerramento e prova final' },
  CANCELLED: { done: 'Lote cancelado', pending: 'Cancelamento' },
}

export const STEPS = {
  title: 'Da criação do lote à consulta pelo comprador',
  items: [
    { title: 'Cadastre', text: 'Registre produtores, propriedades e participantes.' },
    { title: 'Crie', text: 'Gere o passaporte digital do lote.' },
    { title: 'Acompanhe', text: 'Adicione etapas, documentos e responsáveis.' },
    { title: 'Compartilhe', text: 'Gere um QR Code com o histórico público.' },
    { title: 'Verifique', text: 'Confirme a integridade dos registros.' },
  ],
}

export const AUDIENCES = {
  title: 'Para quem é',
  subtitle: 'Cada participante registra a sua parte. Quem compra consulta tudo.',
  items: [
    {
      title: 'Produtores',
      points: [
        'Comprovam a origem.',
        'Organizam lotes e documentos.',
        'Compartilham informações com cooperativas.',
      ],
    },
    {
      title: 'Cooperativas',
      points: [
        'Recebem lotes de diferentes produtores.',
        'Padronizam o histórico.',
        'Registram processamento e armazenamento.',
      ],
    },
    {
      title: 'Transportadoras',
      points: [
        'Confirmam coleta, movimentação e entrega.',
        'Associam documentos ao transporte.',
      ],
    },
    {
      title: 'Compradores e exportadores',
      points: [
        'Consultam origem e trajetória.',
        'Verificam documentos.',
        'Acompanham o histórico sem precisar de uma conta.',
      ],
    },
  ],
}

export const SECURITY = {
  title: 'Registros confiáveis, mesmo entre diferentes participantes',
  // A SHA-256 hash, not a key-based signature: the copy says so plainly.
  text: 'Cada etapa recebe uma impressão digital criptográfica (hash) vinculada ao registro anterior. Isso permite identificar alterações e verificar a integridade de toda a trajetória do lote.',
  points: [
    'Responsável identificado em cada etapa.',
    'Data e hora registradas.',
    'Documentos com hash de integridade.',
    'Histórico de eventos preservado.',
    'Prova opcional registrada em blockchain.',
  ],
  blockchain: 'A versão avançada permite registrar a prova final do lote na rede Solana.',
}

export const FIELD = {
  title: 'Feito para funcionar onde o trabalho acontece',
  points: [
    'Interface responsiva.',
    'Uso pelo celular.',
    'Botões grandes.',
    'Fluxo de registro rápido.',
    'Upload de fotos e documentos.',
    'QR Code pronto para impressão.',
  ],
}

export const CONTACT = {
  title: 'Veja como o AgroPass pode transformar a rastreabilidade da sua operação.',
  text: 'Conheça o fluxo completo, desde a criação do lote até a consulta pelo comprador.',
}

export const PROFILE_OPTIONS = [
  { value: 'PRODUCER', label: 'Produtor' },
  { value: 'COOPERATIVE', label: 'Cooperativa' },
  { value: 'CARRIER', label: 'Transportadora' },
  { value: 'BUYER', label: 'Comprador ou exportador' },
] as const

export type DemoRequestProfile = (typeof PROFILE_OPTIONS)[number]['value']

export const FAQ = [
  {
    question: 'Preciso instalar algum programa?',
    answer: 'Não. O AgroPass funciona pelo navegador em computadores e celulares.',
  },
  {
    question: 'O comprador precisa criar uma conta?',
    answer: 'Não. Passaportes públicos podem ser consultados diretamente pelo QR Code.',
  },
  {
    question: 'É possível adicionar documentos?',
    answer:
      'Sim. Notas, comprovantes, fotografias e outros documentos podem ser associados às etapas.',
  },
  {
    question: 'Os registros podem ser alterados?',
    answer: 'Correções são adicionadas ao histórico sem apagar os registros anteriores.',
  },
  {
    question: 'Preciso utilizar blockchain?',
    answer:
      'Não. A rastreabilidade funciona normalmente sem blockchain. Ela é uma camada adicional de comprovação.',
  },
]

export const FOOTER_TAGLINE = 'AgroPass — Rastreabilidade digital para cadeias agrícolas.'

// Optional profile links, shown only when configured.
export const LINKEDIN_URL = (import.meta.env.VITE_LINKEDIN_URL as string | undefined)?.trim() || null
export const REPOSITORY_URL =
  (import.meta.env.VITE_REPOSITORY_URL as string | undefined)?.trim() ||
  'https://github.com/ViniCPC/agro-pass'
