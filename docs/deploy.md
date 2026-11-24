# Deploy e operação — AgroPass

O repositório contém dois caminhos: uma demo estática sem API no GitHub Pages e a aplicação completa no Render. A configuração está pronta para revisão; nenhuma conta de hospedagem ou recurso pago é criado pelo código. A publicação e os links públicos ainda precisam ser verificados.

## Demo no GitHub Pages

1. Publique os arquivos em `main` e habilite **Settings → Pages → Source → GitHub Actions**.
2. Aguarde o workflow **CI**. Após sucesso no push de `main`, **Demo (GitHub Pages)** publica o mesmo commit.
3. Abra `https://vinicpc.github.io/agro-pass/demo` e `/agro-pass/trace/DEMO-2025-0001`.
4. Se houver uma API hospedada, configure a variável de repositório `DEMO_API_URL` antes do build. Sem ela, utilize o modo demo.

O build recebe `VITE_BASE_PATH=/agro-pass/`. `404.html` permite que links de QR abram a aplicação diretamente, mas o Pages devolve HTTP 404 nessa primeira navegação. Para rotas SPA com HTTP 200, use o frontend do Render, que tem rewrite para `index.html`.

## Aplicação completa no Render

O [Blueprint](../render.yaml) define API Docker, PostgreSQL 16 gerenciado e frontend estático. O banco usa o plano `0.1c-256mb` com 5 GB; a API usa `starter` e disco de 1 GB em `/app/uploads`. São recursos pagos: confira os valores na conta antes de aplicar. Nomes e opções seguem a [referência do Blueprint](https://render.com/docs/blueprint-spec) e os [planos de computação](https://render.com/docs/compute-plans).

1. Conecte o repositório no painel e crie um Blueprint a partir de `render.yaml`.
2. Defina `DEMO_PASSWORD` somente para essa instância de demonstração. O JWT é gerado pela plataforma. O banco aceita conexões internas por padrão.
3. Defina `PUBLIC_APP_URL` com a URL definitiva do frontend e `PUBLIC_BACKEND_URL` com a URL da API. Defina `VITE_API_URL` e `VITE_PUBLIC_APP_URL` com os mesmos endereços correspondentes. Inclua eventual subcaminho do frontend.
4. Confirme `TRUST_PROXY=1` para um proxy confiável da plataforma. Configure a quantidade/rede correta se usar outra topologia; acesso direto usa `false`.
5. Faça o deploy. A imagem instala dependências, gera Prisma e compila; na inicialização, executa `prisma migrate deploy`, seed quando habilitado e inicia `dist/src/main.js`. Falha de migration/seed interrompe o início da API.
6. Os próximos deploys aguardam os checks do GitHub (`autoDeployTrigger: checksPass`). As migrações existentes são aplicadas automaticamente, inclusive as de remoção de tabelas de sprints anteriores. Faça backup antes de apontar para um banco existente; este Blueprint destina-se a uma nova instância.

O seed é aditivo: não reseta senhas, não apaga eventos nem reescreve provas. Alterar `DEMO_PASSWORD` não troca a senha de usuários existentes. Para ambiente operacional, use `SEED_DEMO=false`, mantenha cadastro público desabilitado e provisione contas por um processo controlado. Não ofereça um administrador compartilhado sobre dados reais.

## Variáveis

| Variável | Uso / padrão |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL do backend; gerada pelo Render |
| `JWT_SECRET` | Obrigatória em produção, pelo menos 32 caracteres aleatórios |
| `NODE_ENV` | `production` na API hospedada |
| `PORT` | Porta HTTP, 3000 local; plataforma pode fornecer outra |
| `PUBLIC_APP_URL` | URL do frontend gravada no QR e autorizada no CORS |
| `PUBLIC_BACKEND_URL` | URL da API usada nos metadados blockchain |
| `CORS_ORIGINS` | Origens adicionais separadas por vírgula, sem caminhos |
| `TRUST_PROXY` | Proxies confiáveis; `false` local, `1` no Blueprint |
| `LOG_FORMAT` | `json` em produção por padrão |
| `RATE_LIMIT_PER_MINUTE` | 300 requisições por cliente/rota/minuto |
| `AUTH_RATE_LIMIT_PER_MINUTE` | 10 tentativas por cliente/rota/minuto |
| `ALLOW_PUBLIC_REGISTRATION` | Bloqueado em produção, salvo valor explícito `true` |
| `SEED_DEMO` / `DEMO_PASSWORD` | Habilitar seed e senha de criação na instância fictícia |
| `BLOCKCHAIN_ENABLED` | `false` por padrão; domínio funciona sem rede |
| `BLOCKCHAIN_PROVIDER` / `BLOCKCHAIN_NETWORK` | `solana` / `devnet`; `local` somente testes |
| `SOLANA_RPC_URL`, `SOLANA_TREASURY_KEYPAIR_PATH`, `SOLANA_MERKLE_TREE` | Configuração opcional da Solana; chave nunca no Git |
| `BLOCKCHAIN_MAX_ATTEMPTS` / `BLOCKCHAIN_RETRY_DELAY_MS` | 3 tentativas / 1000 ms |
| `HEALTHCHECK_SOLANA_ENABLED` / `HEALTH_SOLANA_TIMEOUT_MS` | Checagem opcional da rede / 3000 ms |
| `QR_PDF_PUBLIC_BASE_URL` | Compatibilidade do serviço de etiquetas; consulte `.env.example` |
| `VITE_API_URL` | API acessível pelo navegador |
| `VITE_PUBLIC_APP_URL` | Domínio definitivo do QR; vazio usa a origem atual |
| `VITE_BASE_PATH` | `/` no Render; `/agro-pass/` no Pages |
| `VITE_SOLANA_CLUSTER` | Rede dos links do Explorer, `devnet` |
| `TEST_DATABASE_URL` | Banco exclusivo dos testes, nome contendo `test` |

Variáveis `VITE_*` são públicas e incorporadas no build. Alterá-las exige novo build. Nunca coloque senhas ou chaves nelas. Templates: [backend](../backend/.env.example), [frontend](../frontend/.env.example), [banco de teste](../backend/.env.test.example).

## Verificação depois de publicar

- `/health/live` retorna 200; `/health` confirma o banco. Não use liveness como prova de saúde do banco.
- Entre com a conta de demo configurada, crie um lote, registre todas as etapas, encerre e publique.
- Abra um passaporte em uma janela sem sessão. Confira que e-mail, documento pessoal e arquivos privados não aparecem.
- Baixe PNG/PDF, escaneie com um celular fora da rede do computador e recarregue o link direto.
- Faça um upload e reinicie a API; confirme que o arquivo permanece disponível conforme sua permissão.
- Confira logs JSON por `X-Request-Id`, CI do commit publicado e retenção/restauração do banco e disco.

Publique a URL definitiva e apenas as credenciais da instância fictícia no README depois dessas verificações. Atualmente não há URL de backend verificada nem resultado remoto de CI desta alteração.

## Backup e limitações operacionais

Banco e uploads são persistidos separadamente: faça backups coordenados e teste restauração dos dois. O hash do documento identifica o conteúdo, mas não restaura um arquivo perdido. O disco local não suporta múltiplas réplicas compartilhando os mesmos arquivos; a próxima implementação prevista é S3. Migrations não devem ser revertidas apagando tabelas manualmente.
