# Integração Solana Devnet

A prova real usa Bubblegum (cNFT) e memo `agropass:v1:<publicCode>:<hash final>` na mesma transação. A chave privada nunca deve ir ao Git, frontend, README ou chat.

## Estado validado em 26/11/2026

- Carteira: `J9FfzrbtjFtaB5anQy1NcyCHJ8Bfdg6SQD9g1AyNsfge`; a consulta encontrou 10 SOL de teste antes da criação da árvore (não foi necessário novo airdrop).
- Árvore Bubblegum V2 criada: `97UV9fzZJUTt8hjSjPKHX9NNfxbXWxvAMjjMzVCbF9CC`.
- Configuração local: provider Solana, rede Devnet, árvore definida e blockchain habilitada. Chave em `backend/keys/treasury-devnet.json`, ignorada pelo Git/Docker.
- Lote fictício persistido: `AGP-2026-0001` (`cddec6f1-310d-49e8-8983-fd71a4fb0e54`), encerrado, público, com 7 eventos e cadeia íntegra.
- Transação confirmada via RPC, sem erro; memo comparado ao hash final.
- Hash final: `5da06ec7349e07752974bd1901dd1a6c6f3211f57c086bab39bc04e8e8df564d`.
- cNFT: `r6igS6igKEGaUG2fFUncT49Z2NyKWUz2K6Bsh7cH7w5`.
- [Transação no Explorer](https://explorer.solana.com/tx/ukCB9umbiKmggfMxsJTSd6ogYXxNqixD92W7QP9f7u4L7FeNX2YyjFNstrWPdMQ1LEaRLmyYrhGZXn5De6hP8yG?cluster=devnet).
- Repetição da tokenização retornou a mesma transação (idempotência).
- Teste executado pelos serviços reais do backend com PostgreSQL e Devnet; não foi um teste de navegador/login HTTP.
- Metadados desta prova descartável usam `http://localhost:3000`. Eles não estarão acessíveis remotamente. Configure a URL definitiva antes de emitir um novo lote de apresentação.
- Render continua adiado por solicitação do usuário.

## Preparar localmente

No `backend/.env`, mantenha:

```env
BLOCKCHAIN_ENABLED=false
BLOCKCHAIN_PROVIDER=solana
BLOCKCHAIN_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_TREASURY_KEYPAIR_PATH=./keys/treasury-devnet.json
SOLANA_MERKLE_TREE=
```

Após receber SOL de teste, na pasta backend:

```powershell
npm.cmd run solana:status
npm.cmd run solana:create-tree
```

O script cria uma árvore Bubblegum V2 privada (depth 14, buffer 64, canopy 0), imprime endereço e link da transação. Canopy 0 reduz armazenamento para esta demonstração de mint; não é uma escolha para otimizar transferências em produção. O script confere o genesis da Devnet e recusa criar outra árvore quando `SOLANA_MERKLE_TREE` já está preenchida. Não repita a criação após timeout sem conferir a carteira no Explorer.

Copie o endereço retornado para `SOLANA_MERKLE_TREE`. Defina `PUBLIC_BACKEND_URL` como a URL estável da API que servirá os metadados. Esse endereço é gravado no token imutável: localhost só serve para uma prova descartável de desenvolvimento.

Só então altere `BLOCKCHAIN_ENABLED=true` e reinicie o backend.

## Testar uma prova real

1. Entre com administrador no modo autenticado, fora da demo.
2. Crie um lote de teste e registre as etapas até a entrega.
3. Publique o passaporte para disponibilizar seus metadados públicos.
4. Encerre o lote: o backend tenta registrar a prova automaticamente.
5. Se o registro falhar, confira configuração/saldo e use a ação de tentar novamente.
6. Abra o link específico da transação no Explorer, com `?cluster=devnet`.
7. Confira sucesso, instrução Bubblegum e memo contendo o publicCode e o mesmo hash final exibido no passaporte.
8. Repetir a solicitação para um lote confirmado deve retornar a prova existente, sem novo mint.

A transação acima foi validada pelo RPC. A interface dinâmica do Explorer não pôde ser inspecionada pelo navegador automatizado nesta sessão. Devnet é uma rede de testes, não uma garantia de permanência de dados de produção.

## Render (para a etapa futura)

Use Secret Files para `treasury-devnet.json` e configure `SOLANA_TREASURY_KEYPAIR_PATH=/etc/secrets/treasury-devnet.json`. O conteúdo é o array JSON do arquivo local, nunca um valor VITE. Não copie o segredo para a imagem Docker. Configure as demais variáveis acima, URL pública da API e só habilite após validar carteira/árvore. Confira permissões de leitura do arquivo no runtime.

Documentação: https://render.com/docs/configure-environment-variables e https://render.com/docs/docker-secrets.
Árvores V2: https://www.metaplex.com/docs/smart-contracts/bubblegum-v2/create-trees.

## Simulações

A demo e o provider local não enviam transações. Seus hashes são calculados localmente; comprovantes simulados não recebem links para o Explorer nem rótulo On-chain. Falha e registro pendente são apresentados como estados diferentes. O dashboard usa a transação real disponível, sem hash fixo inventado.
