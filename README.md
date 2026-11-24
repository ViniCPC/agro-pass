# AgroPass

Plataforma full-stack de passaportes digitais para rastreabilidade agrícola. Cada lote possui um passaporte único, uma linha do tempo auditável, documentos, código público, QR Code e prova opcional na Solana.

## Domínio principal

- produtores, cooperativas e propriedades de origem;
- lotes com código `AGP-YYYY-NNNN`;
- eventos assinados pelo usuário autenticado;
- documentos vinculados à propriedade, lote ou etapa;
- passaportes públicos consultáveis sem autenticação;
- prova digital por cNFT na Solana;
- PostgreSQL, Prisma e health check.

O ciclo de um lote é:

```text
CREATED → HARVESTED → RECEIVED → IN_TRANSIT → PROCESSED → DELIVERED → CLOSED
```

Um lote ativo também pode ser cancelado. Lotes `CLOSED` ou `CANCELLED` não recebem documentos, transições, tokenização ou etapas comuns; somente um administrador pode acrescentar uma correção auditável sem alterar o evento original.

## Papéis e permissões

| Papel | Operações |
| --- | --- |
| `PRODUCER` | Criar lote em propriedade própria e registrar colheita |
| `COOPERATIVE` | Registrar recebimento, processamento e documentos dos produtores vinculados |
| `OPERATOR` | Registrar transporte e entrega |
| `ADMIN` | Gerenciar todos os registros, publicação, cancelamento e fechamento |
| Público | Consultar somente passaportes marcados como públicos |

O nome e o `userId` de cada evento são obtidos do JWT. O endpoint não aceita `actorName` enviado pelo cliente.

## Cadeia de integridade

Cada evento recebe um número `sequence`, um `previousHash` e um `eventHash` SHA-256. O hash inclui o lote, a sequência, o tipo, o usuário autenticado, a data, a localização, as observações, o hash anterior e os hashes dos documentos anexados.

O `integrityHash` do lote sempre aponta para o último evento. `GET /batches/:id/events/integrity` recalcula toda a cadeia e informa qualquer sequência, evento ou hash final adulterado. Eventos não possuem rotas de edição ou exclusão; uma retificação é registrada como um novo evento `CORRECTION`, referenciando o evento original.

Uploads usam a interface `FileStorage`. Em desenvolvimento, `LocalFileStorage` grava em `backend/uploads`; a interface permite adicionar uma implementação S3 sem alterar o domínio. Cada documento armazena nome original, tamanho, MIME type e SHA-256. O upload cria automaticamente um evento `DOCUMENT_ATTACHED`.

## Estrutura

```text
backend/
  prisma/             schema, migrations e seed
  src/
    auth/             cadastro, login, JWT, guards e papéis
    producers/        produtores
    cooperatives/     cooperativas e importação CSV
    farms/            propriedades de origem
    batches/          passaporte, ciclo, documentos e QR Code
    event-chain/      encadeamento e verificação criptográfica
    trace-events/     linha do tempo auditável
    storage/          abstração FileStorage e armazenamento local
    public-batches/   consulta pública e metadata
    solana/           tokenização cNFT
    health/           saúde da aplicação
frontend/
  src/
    pages/             login, dashboard, propriedades, lotes e consulta pública
    contexts/          sessão JWT e modo demonstração
    features/          componentes por domínio
```

## Requisitos

- Node.js 22+
- npm
- PostgreSQL 16+ ou Docker

## Configuração

Copie `.env.example` na raiz para `.env` e configure o PostgreSQL. Depois copie `backend/.env.example` para `backend/.env`:

```env
DATABASE_URL="postgresql://agro_pass:troque_a_senha@localhost:5432/agro_pass"
JWT_SECRET="use-um-segredo-longo-e-aleatorio"
PORT=3000
PUBLIC_APP_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

A prova em blockchain vem desligada (`BLOCKCHAIN_ENABLED=false`) e a API funciona por completo sem ela. Para registrar provas na Solana devnet:

```env
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_TREASURY_KEYPAIR_PATH=./keys/treasury-devnet.json
SOLANA_MERKLE_TREE=
PUBLIC_BACKEND_URL=https://api.seudominio.com
```

Para desenvolver sem rede, use `BLOCKCHAIN_PROVIDER=local`: as provas ficam em memória e os testes e2e sempre usam esse provider.

No frontend, copie `frontend/.env.example` para `frontend/.env.local`. `VITE_API_URL` aponta para a API (padrão `http://localhost:3000`) e `VITE_PUBLIC_APP_URL` define o domínio gravado nos QR Codes.

## Instalação e execução

```bash
docker compose up -d

cd backend
npm ci
npx prisma migrate deploy
npm run seed
npm run start:dev
```

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Frontend: `http://localhost:5173`. API: `http://localhost:3000`.

## Autenticação

Rotas internas esperam `Authorization: Bearer <token>`.

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| `POST` | `/auth/register` | Cadastrar produtor, cooperativa ou operador |
| `POST` | `/auth/login` | Obter JWT |
| `GET` | `/auth/me` | Consultar o usuário autenticado |

Usuários produtores informam um `producerId`; cooperativas informam um `cooperativeId`. Administradores não podem ser criados pelo cadastro público.

## Passaporte digital

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| `POST` | `/batches` | Criar passaporte associado a uma propriedade |
| `GET` | `/batches` | Listar lotes |
| `GET` | `/batches/:id` | Consultar lote |
| `GET` | `/batches/:id/transitions` | Consultar próximas transições permitidas |
| `PATCH` | `/batches/:id/status` | Registrar a próxima etapa |
| `PATCH` | `/batches/:id/cancel` | Cancelar lote |
| `PATCH` | `/batches/:id/close` | Encerrar lote entregue |
| `PATCH` | `/batches/:id/visibility` | Tornar passaporte público ou privado |
| `POST` | `/batches/:id/documents` | Anexar documento (campo opcional `isPublic`, padrão `false`) |
| `PATCH` | `/batches/:id/documents/:documentId/visibility` | Liberar ou restringir o arquivo no passaporte público |
| `GET` | `/batches/:id/events` | Consultar a linha do tempo em ordem sequencial |
| `GET` | `/batches/:id/events/integrity` | Verificar toda a cadeia de hashes |
| `POST` | `/batches/:id/events` | Registrar uma correção auditável (`CORRECTION`) |
| `POST` | `/batches/:id/qrcode` | Gerar QR Code do código público (data URL, sem gravar em disco) |
| `GET` | `/batches/:id/qrcode/print-sheet?copies=4\|8\|16` | Folha PDF de etiquetas |
| `POST` | `/batches/:id/tokenize` | Repetir o registro da prova de um lote encerrado (idempotente, admin) |
| `GET` | `/public/batches/:publicCode` | Consultar passaporte público sem login |
| `GET` | `/public/batches/:publicCode/integrity` | Verificar a cadeia de um passaporte público sem login |

`GET /health` também é público.

### Passaporte público e QR Code

A página `/trace/:publicCode` abre sem login e mostra o lote, a propriedade de origem, a linha do tempo com responsável e hash de cada etapa, os documentos, a verificação de integridade e a prova na Solana, quando existir.

O que **não** é publicado: IDs de usuário, e-mails, telefones, CPF/CNPJ e a localização exata (as coordenadas saem arredondadas para cerca de 1 km). Documentos nascem restritos: o passaporte mostra o tipo, a data e o SHA-256, mas só oferece o arquivo quando ele é marcado como público.

No detalhe do lote, o QR, o PNG e a folha PDF (4, 8 ou 16 etiquetas, com pré-visualização) são gerados no navegador a partir do código público, sem depender da API. Para que etiquetas impressas continuem funcionando depois do deploy:

- Defina `VITE_PUBLIC_APP_URL` (frontend) e `PUBLIC_APP_URL` (backend) com o domínio definitivo. Em produção a API recusa gerar QR sem `PUBLIC_APP_URL`.
- O host estático precisa devolver `index.html` em qualquer rota. `frontend/public/_redirects` (Netlify, Cloudflare Pages) e `frontend/vercel.json` (Vercel) já fazem isso; em outro host, configure o equivalente.

Para testar o QR no celular durante o desenvolvimento, rode `npm run dev:lan` no frontend e abra o app pelo IP da máquina. Um QR que aponta para `localhost` só abre no próprio computador, e a tela avisa quando isso acontece.

### Prova em blockchain

Cada lote tem um único cNFT, que funciona como seu passaporte on-chain. Os eventos ficam no PostgreSQL, cada um com seu hash. Ao **encerrar** o lote, a API registra na Solana o hash final da cadeia: o cNFT é mintado com um memo `agropass:v1:<código público>:<hash>` na mesma transação. O hash fica legível no Solana Explorer e o passaporte mostra o mesmo valor, comparado com o hash final da cadeia.

- **Não altera o lote.** O registro acontece em segundo plano depois do encerramento. A prova é gravada no lote (rede, hash, endereço, transação e horário), nunca como evento novo, porque a cadeia encerrada é imutável. Uma falha da Solana marca a prova como `FAILED`, e o lote continua encerrado e íntegro.
- **Nunca minta duas vezes.** Um claim atômico no banco garante um único registro por vez. Um lote `CONFIRMED` devolve a prova existente. Antes de cada tentativa, o provider procura na rede um memo do lote, o que cobre uma queda entre o envio e a gravação.
- **Retry.** São até `BLOCKCHAIN_MAX_ATTEMPTS` tentativas com backoff exponencial. Erros de configuração não são repetidos. Depois de uma falha, um admin repete pelo detalhe do lote ou por `POST /batches/:id/tokenize`.
- **Integridade.** A API recusa ancorar uma cadeia que não passa na verificação de integridade.
- **Provider plugável.** `BlockchainProofProvider` tem dois adaptadores: `SolanaProofProvider` (Bubblegum) e `LocalProofProvider` (em memória, para testes). Com a Solana fora do ar, `/health` responde `degraded` com status 200; só o banco gera 503.

### Modo demonstração

"Entrar na demo" em `/demo` ativa o modo demonstração, que fica salvo no `localStorage` e funciona sem backend. O lote `DEMO-2025-0001` percorre todas as etapas, com documentos e registro on-chain, e seus hashes são SHA-256 reais calculados como na API. "Ver passaporte de exemplo" abre `/trace/DEMO-2025-0001` em qualquer aparelho, com ou sem o modo ativo. Lotes criados durante a demo ficam só no navegador em que foram criados. "Sair da demo" apaga esses dados.

## Seed

O seed cria cooperativa, produtor, propriedade, lote, eventos e usuários dos quatro papéis. Todas as senhas são armazenadas como hash bcrypt.

```bash
cd backend
npm run seed
```

## Validação

```bash
cd backend
npm ci
npm run build
npm test

npm run test:e2e:db:up
npm run test:e2e
npm run test:e2e:db:down

cd ../frontend
npm ci
npm run build
npm run lint
```

O E2E usa PostgreSQL isolado na porta `55432`. O build do backend executa `prisma generate`, e a produção inicia com `node dist/src/main.js`.
