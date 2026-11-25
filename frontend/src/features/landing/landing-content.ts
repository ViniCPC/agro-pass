import type { BatchStatus } from '@/types/api'
import plantationPhoto from '@/assets/landing/coffee-plantation.jpg'
import warehousePhoto from '@/assets/landing/coffee-warehouse.jpg'

// All landing page copy in one place. The product leads: a real lot, its
// stages and its proof. Specific facts come from the demo lot the QR opens,
// so the page can be checked against the passport itself.

export const NAV_ITEMS = [
  { hash: '#plataforma', label: 'Plataforma' },
  { hash: '#rastreabilidade', label: 'Rastreabilidade' },
  { hash: '#demonstracao', label: 'Demonstração' },
] as const

export const HERO = {
  badge: 'Demonstração com dados fictícios',
  title: 'A origem registrada. A trajetória à vista.',
  titleLead: 'A origem registrada.',
  titleRest: 'A trajetória à vista.',
  subtitle: 'Conecte produtores, cooperativas e compradores pelo histórico de cada lote.',
  note: 'Abra um lote completo sem criar conta.',
}

// Photos from Wikimedia Commons, credited as their CC BY 2.0 licence asks.
export const PHOTOS = {
  warehouse: {
    src: warehousePhoto,
    alt: 'Sacas de café empilhadas em um armazém',
    credit: 'Foto ilustrativa: DFID – UK Department for International Development, CC BY 2.0',
    title: 'Thousands of bean bags',
    author: 'DFID – UK Department for International Development',
    source: 'https://commons.wikimedia.org/wiki/File:Thousands_of_bean_bags.jpg',
  },
  plantation: {
    src: plantationPhoto,
    alt: 'Vista aérea de uma lavoura de café em fileiras, com estradas de terra vermelha',
    credit: 'Foto ilustrativa: Lukas from Tokyo, Japan, CC BY 2.0',
    title: 'Coffee plantation, Kauaʻi 58',
    author: 'Lukas from Tokyo, Japan',
    source: 'https://commons.wikimedia.org/wiki/File:Coffee_plantation,_Kau%CA%BBi_58.jpg',
  },
  license: 'https://creativecommons.org/licenses/by/2.0/',
}

// The three tabs of the interactive section.
export const PLATFORM = {
  title: 'Três telas, um lote inteiro.',
  subtitle: 'Escolha uma etapa para ver a parte da plataforma que cuida dela, com os dados do lote AGP-2026-0002.',
  tabs: [
    {
      id: 'registrar',
      label: 'Registrar origem',
      text: 'O produtor cria o lote no celular: produto, quantidade, propriedade e local. O código e o QR saem na hora.',
    },
    {
      id: 'acompanhar',
      label: 'Acompanhar etapas',
      text: 'Cooperativa e transporte confirmam as próprias etapas. Cada registro tem responsável, data, anexo e hash.',
    },
    {
      id: 'compartilhar',
      label: 'Compartilhar passaporte',
      text: 'A etiqueta sai pronta para imprimir. O comprador escaneia o QR e lê o passaporte público, sem criar conta.',
    },
  ],
} as const

export type PlatformTab = (typeof PLATFORM.tabs)[number]['id']

// Who does what along the chain, and which stages each one records.
export const CHAIN = {
  title: 'Do produtor ao comprador.',
  subtitle: 'Cada participante registra a própria etapa. O histórico se monta sozinho, na ordem em que o lote anda.',
  actors: [
    { name: 'Produtor', action: 'Cria o lote e registra a colheita.', stages: ['CREATED', 'HARVESTED'] },
    { name: 'Cooperativa', action: 'Confirma o recebimento e o processamento.', stages: ['RECEIVED', 'PROCESSED'] },
    { name: 'Transporte', action: 'Registra a coleta e a entrega.', stages: ['IN_TRANSIT', 'DELIVERED'] },
    { name: 'Comprador', action: 'Escaneia o QR e verifica a origem.', stages: [] },
  ] as Array<{ name: string; action: string; stages: BatchStatus[] }>,
  field: {
    title: 'O campo continua sendo o ponto de partida.',
    text: 'A origem é registrada onde o lote nasce, com local e responsável. Daí em diante, cada etapa se soma à anterior e nada é reescrito.',
  },
}

export const TRUST = {
  title: 'Documentos que dá para conferir. Uma cadeia que denuncia alterações.',
  docsTitle: 'Documentos do lote',
  docsText: 'A nota fiscal e o recibo ficam na etapa que comprovam. O navegador baixa o PDF e recalcula o hash.',
  integrityTitle: 'Tente adulterar este lote.',
  integrityText: 'Cada etapa guarda o hash da anterior. Mude a observação do recebimento e a verificação recalcula a cadeia, do mesmo jeito que a API.',
  field: 'Observação registrada na etapa #3, recebimento',
  tamperTo: 'Recebidas 150 sacas de 60 kg',
  hide: 'Para esconder a mudança seria preciso refazer o hash de todas as etapas seguintes, e o hash final deixaria de bater com o registrado no encerramento.',
  extraTitle: 'Prova adicional',
  extra: 'O hash final do lote pode ser ancorado em blockchain quando essa camada estiver habilitada. A rastreabilidade funciona sem ela.',
}

export const DEMO = {
  title: 'Abra a demonstração.',
  text: 'Crie um lote, registre as etapas, encerre e escaneie o QR. Os dados são fictícios e tudo roda no seu navegador.',
  formTitle: 'Prefere uma conversa?',
  formText: 'Deixe seu contato e combinamos uma apresentação com a sua cadeia.',
}

// How each lifecycle stage reads on the landing page.
export const STAGE_COPY: Record<BatchStatus, { done: string; pending: string; short: string }> = {
  CREATED: { done: 'Lote criado pelo produtor', pending: 'Criação do lote', short: 'Criação' },
  HARVESTED: { done: 'Colheita registrada', pending: 'Colheita', short: 'Colheita' },
  RECEIVED: { done: 'Recebimento confirmado', pending: 'Recebimento pela cooperativa', short: 'Recebimento' },
  IN_TRANSIT: { done: 'Transporte iniciado', pending: 'Transporte', short: 'Transporte' },
  PROCESSED: { done: 'Processamento concluído', pending: 'Processamento', short: 'Processamento' },
  DELIVERED: { done: 'Entrega confirmada', pending: 'Entrega aguardando confirmação', short: 'Entrega' },
  CLOSED: { done: 'Lote encerrado', pending: 'Encerramento', short: 'Encerramento' },
  CANCELLED: { done: 'Lote cancelado', pending: 'Cancelamento', short: 'Cancelamento' },
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
    answer: 'Não. O passaporte público abre direto pelo QR Code.',
  },
  {
    question: 'Os registros podem ser alterados?',
    answer: 'Correções entram como novos registros. O registro original continua no histórico.',
  },
  {
    question: 'Preciso utilizar blockchain?',
    answer: 'Não. A rastreabilidade e a verificação de integridade funcionam sem blockchain.',
  },
]

export const FOOTER_TAGLINE = 'AgroPass — o passaporte público de um lote agrícola.'

// Optional profile links, shown only when configured.
export const LINKEDIN_URL = (import.meta.env.VITE_LINKEDIN_URL as string | undefined)?.trim() || null
export const REPOSITORY_URL =
  (import.meta.env.VITE_REPOSITORY_URL as string | undefined)?.trim() ||
  'https://github.com/ViniCPC/agro-pass'
