# AgroPass

AgroPass is a full-stack agricultural traceability platform built for the Solana Coliseum/Frontier Hackathon. It enables Brazilian rural producers to register farms, run EUDR (EU Deforestation Regulation) compliance checks, create certified commodity batches, mint immutable on-chain records as compressed NFTs (cNFTs) on Solana devnet, and share a public, QR-scannable traceability certificate with buyers and regulators.

---

## Architecture

```
agro-pass/
├── backend/        NestJS API (Node.js, TypeScript, Prisma, PostgreSQL)
├── frontend/       React + Vite dashboard and public trace page
└── scripts/        Dev-environment helper scripts (PowerShell)
```

### Backend (NestJS)

| Module | Responsibility |
|--------|---------------|
| `farms` | CRUD for farms, CAR document storage |
| `eudr` | EUDR compliance orchestration (MapBiomas, PRODES, Hansen, Sentinel Hub) |
| `batches` | Commodity batch lifecycle, QR code generation, PDF export |
| `trace-events` | Immutable event log per batch (harvest, transport, processing, etc.) |
| `solana` | Compressed NFT minting via Bubblegum on Solana devnet |
| `telegram` | Producer-facing Telegram bot (account linking, harvest registration, stage recording, Gemini AI chat) |
| `cooperatives` | Cooperative management and producer import |
| `ai` | Claude Vision-powered CAR document parsing |
| `reports` | HTML-to-PDF EUDR validation reports |
| `health` | Liveness check (DB + optional Solana RPC) |
| `public-batches` | Public read-only trace endpoint (no auth) |

### Frontend (React + Vite)

| Area | Pages / Features |
|------|-----------------|
| Dashboard | Compliance overview, blockchain proof summary, recent batches and farms |
| Farms | Farm list, farm detail with EUDR validation history and satellite before/after comparison |
| Batches | Batch list, batch detail, batch creation form with farm selector, Solana mint flow |
| QR | QR code generation, download, printable A4 sheet |
| Public Trace | `/trace/:code` — publicly accessible certificate page (no login required) |
| Demo mode | Fully offline demo using local mock data (no backend required) |

---

## Features

- **EUDR compliance engine** — Cross-references farm coordinates against MapBiomas Alerta, PRODES, Hansen deforestation datasets, and Sentinel Hub NDVI satellite imagery. Produces a deterministic compliance status (COMPLIANT / NEEDS_REVIEW / NON_COMPLIANT).
- **Claude Vision CAR parsing** — Producers upload a photo of their CAR (Cadastro Ambiental Rural) document; Claude extracts all structured fields automatically.
- **Solana compressed NFTs** — Each certified batch is minted as a cNFT using the Metaplex Bubblegum program, with metadata anchored on-chain.
- **Telegram bot** — Producers interact entirely via Telegram: link their account, register farms, log harvest stages (with optional photo evidence), and chat with a Gemini-powered AI assistant.
- **Public traceability page** — Every batch gets a unique URL (`/trace/AGP-YYYY-XXXX`) and a QR code. Anyone can scan it to see the full supply-chain timeline, EUDR status, farm data, and Solana proof — no login needed.
- **PDF EUDR report** — Downloadable compliance report with satellite data, deforestation indices, and legal reserve status.
- **Demo mode** — The frontend includes a full offline demo using realistic Brazilian farm data. No backend connection required for demos.

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend runtime | Node.js 20, NestJS 10, TypeScript |
| Database | PostgreSQL 15, Prisma ORM |
| Blockchain | Solana devnet, Metaplex Bubblegum (cNFTs), `@metaplex-foundation/umi` |
| AI — document parsing | Anthropic Claude (`claude-3-5-sonnet`) via `@anthropic-ai/sdk` |
| AI — bot chat | Google Gemini (`gemini-2.0-flash`) via `@google/genai` |
| Satellite imagery | Sentinel Hub (optional) — falls back to deterministic mock |
| Telegram bot | Telegraf 4, WizardScene for multi-step flows |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, Framer Motion |
| QR codes | `qrcode` library, PDFKit for printable sheets |
| Reports | `html-pdf-node` for HTML→PDF |

---

## Prerequisites

- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- (Optional) An Anthropic API key for CAR document parsing
- (Optional) Sentinel Hub account for real satellite imagery
- (Optional) Solana CLI and a funded devnet wallet for cNFT minting

For **Docker Compose** (recommended): Docker 24+ with the Compose plugin.  
For **local dev**: Node.js 20+ and PostgreSQL 15+.

---

## Getting Started

### Option A — Docker Compose (recommended)

All services (PostgreSQL, backend, frontend) start with a single command.

#### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=agro_pass

TELEGRAM_BOT_TOKEN=your_token_here   # from @BotFather
GEMINI_API_KEY=your_key_here         # from Google AI Studio
```

#### 2. Build and start

```bash
docker compose up --build
```

#### 3. Seed demo data (first run only)

```bash
docker compose exec backend npx ts-node prisma/seed.ts
```

Services will be available at:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger docs | http://localhost:3000/api |

To stop everything:

```bash
docker compose down
```

To wipe the database volume as well:

```bash
docker compose down -v
```

---

### Option B — Local development

#### 1. Clone and install

```bash
git clone https://github.com/ViniCPC/agro-pass.git
cd agro-pass

cd backend && npm install
cd ../frontend && npm install
```

#### 2. Configure environment

```bash
# Root .env — starts PostgreSQL via Docker Compose
cp .env.example .env

# Backend .env — used when running npm run start:dev directly
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/agro_pass"
PORT=3000

TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_ENABLED=true

GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash

SATELLITE_PROVIDER=MOCK
HEALTHCHECK_SOLANA_ENABLED=false
CORS_ORIGINS=http://localhost:5173
```

#### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

#### 4. Database setup

```bash
cd backend
npx prisma migrate deploy
npx ts-node prisma/seed.ts   # seed demo data
```

#### 5. (Optional) Solana devnet setup

```bash
npx ts-node src/scripts/create-devnet-wallet.ts
npx ts-node src/scripts/request-devnet-airdrop.ts
npx ts-node src/scripts/create-merkle-tree.ts
# Copy the output address into SOLANA_MERKLE_TREE in backend/.env
```

#### 6. Run

```bash
# Terminal 1 — Backend
cd backend && npm run start:dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Or use the all-in-one PowerShell script:

```powershell
.\scripts\start-agropass-dev.ps1
```

The backend starts on `http://localhost:3000` (Swagger at `/api`).  
The frontend starts on `http://localhost:5173`.

---

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and main menu |
| `/vincular` | Link your Telegram account to a producer profile |
| `/colheita` | Register a new harvest (farm → product → weight → optional CAR photo) |
| `/etapa` | Add a custom supply-chain stage to the latest active batch (freeform name + optional photo) |
| `/fazendas` | List your registered farms |
| (free text) | Gemini AI assistant answers questions about EUDR, AgroPass, and traceability |

---

## API Overview

Full interactive docs available at `http://localhost:3000/api` (Swagger).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/farms` | List all farms |
| POST | `/farms` | Create a farm |
| GET | `/farms/:id` | Farm detail with latest EUDR validation |
| POST | `/eudr/validate` | Run EUDR compliance check for a farm |
| GET | `/batches` | List batches |
| POST | `/batches` | Create a batch |
| POST | `/batches/:id/mint` | Mint batch as cNFT on Solana |
| POST | `/batches/:id/qr` | Generate QR code PNG |
| GET | `/batches/:id/qr/pdf` | Download printable QR sheet PDF |
| GET | `/public/batches/:code` | Public trace payload (no auth) |
| GET | `/eudr/report/:farmId` | Download EUDR PDF report |
| GET | `/trace-events/:batchId` | Event log for a batch |
| POST | `/trace-events` | Add a trace event |

---

## Public Trace Page

Every batch gets a public URL:

```
http://localhost:5173/trace/{BATCH_CODE}
```

Example: `http://localhost:5173/trace/AGP-2025-001`

The page shows:
- Batch summary (product, quantity, cooperative)
- Farm card (location, biome, area)
- EUDR compliance card (status, deforestation area, NDVI, satellite images)
- Supply-chain timeline with all registered stages and uploaded documents
- Blockchain proof card (cNFT address, transaction hash, Solscan link)
- Downloadable documents panel

No login is required. The page is designed to be shared with buyers, auditors, and EU importers.

---

## Demo Data

After running the seed, the database contains:

| Farm | Location | EUDR Status |
|------|----------|-------------|
| Fazenda Boa Esperança | Rio Verde, GO | Compliant |
| Sítio Vale Verde | Lavras, MG | Compliant |
| Fazenda Floresta Viva | Manaus, AM | Compliant |
| Fazenda Cerradão | Goiânia, GO | Needs Review |
| Fazenda São Benedito | Marabá, PA | Non-Compliant |

**Demo producer** (use this phone number in the Telegram bot `/vincular` flow):
- Phone: `64999990001` — Carlos Alberto Mendes

---

## Database Reset

To wipe all data and re-seed from scratch:

```bash
cd backend
npx ts-node scripts/clean-db.ts   # truncates all tables
npx ts-node prisma/seed.ts         # re-seeds demo data
```

Or use the combined PowerShell script:

```powershell
.\backend\scripts\start-clean.ps1
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | API port (default: 3000) |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token from @BotFather |
| `TELEGRAM_ENABLED` | No | Set to `false` to disable bot (default: true) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Gemini model ID (default: gemini-2.0-flash) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (required for CAR parsing) |
| `SATELLITE_PROVIDER` | No | `MOCK` or `SENTINEL_HUB` (default: MOCK) |
| `SENTINEL_HUB_CLIENT_ID` | No | Sentinel Hub OAuth client ID |
| `SENTINEL_HUB_CLIENT_SECRET` | No | Sentinel Hub OAuth client secret |
| `SOLANA_RPC_URL` | No | Solana RPC endpoint (default: devnet) |
| `SOLANA_TREASURY_KEYPAIR_PATH` | No | Path to treasury wallet JSON |
| `SOLANA_MERKLE_TREE` | No | Bubblegum tree address for cNFT minting |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `PUBLIC_BATCHES_URL` | No | Base URL used in generated QR codes |
| `HEALTHCHECK_SOLANA_ENABLED` | No | Include Solana in health check (default: true) |

---

## License

MIT
