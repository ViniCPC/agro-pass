# Revisão técnica — Sprint 8

Revisão local em 24/11/2026. Escopo: API, autenticação/permissões, ciclo de lotes, integridade, uploads, passaporte público, interface, dependências, testes, CI e configuração de deploy. Esta revisão não substitui um teste de invasão ou uma auditoria independente.

## Correções e evidências

| Achado | Correção / evidência |
| --- | --- |
| URLs de uploads eram servidas sem verificar publicação | Download público consulta documento e passaporte a cada acesso; download privado exige JWT e autorização; E2E verifica revogação e 401/404 |
| Segredo JWT de desenvolvimento poderia ser usado em produção | Inicialização recusa segredo ausente, curto ou padrão; teste de configuração |
| Cadastro público permite associar IDs sem comprovar identidade | Desabilitado por padrão em produção até existir convite; teste de serviço |
| Upload concorrente com encerramento | Lock na linha do lote e nova checagem dentro da transação; teste de regressão |
| Falha de banco poderia deixar arquivo órfão | Limpeza do armazenamento ao falhar a operação; teste de regressão |
| MIME declarado e extensão do cliente não eram suficientes | Assinatura inicial conferida, extensão derivada do MIME, tamanho limitado e download como anexo |
| Erros de infraestrutura poderiam expor mensagens internas | Resposta sanitizada, logs por tipo e request ID, health check com timeout |
| Seed reescrevia registros existentes | Seed aditivo e transacional por lote; E2E executa duas vezes, compara usuários/eventos e verifica as cadeias |
| Data de colheita mudava no fuso brasileiro | Formatação da data civil em UTC; E2E verifica a data informada no detalhe e no passaporte |
| Demo podia ser publicada antes do resultado do CI | Pages publica o commit aprovado de `main`; Render aguarda checks |

## Dependências

O `npm audit --omit=dev` inicial do backend apontava 35 entradas (1 crítica e 12 altas); o frontend tinha 2. Foram atualizados lockfiles dentro das versões principais, alinhados Prisma/Nest e aplicados overrides específicos a dependências transitivas. Após a resolução: backend com **9 moderadas, 0 altas e 0 críticas**; frontend com **0**. Contagens são um retrato dessa data, não uma garantia futura.

Overrides no backend:

- `effect` 3.22.1: versão corrigida do [ReDoS em TemplateLiteral](https://github.com/advisories/GHSA-7589-6fvf-x4pw).
- `bn.js` 4.12.5: atualização dentro da série 4 que inclui a correção do [loop infinito](https://github.com/advisories/GHSA-378v-28hj-76wf).
- `brace-expansion` 1.1.22: atualização dentro da série 1 que inclui correções de [negação de serviço](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr).

Os nove alertas moderados de produção são propagados pela cadeia `Umi → @solana/web3.js → jayson → stream-json/uuid`. O npm não oferece atualização compatível completa para essa cadeia. Não foi aplicado downgrade do Bubblegum nem troca de versões principais dos parsers por override. Blockchain continua desligada no Blueprint. Antes de habilitar Solana em uma implantação operacional, revisar esses avisos, atualizar o SDK de forma compatível e validar a integração real. Os testes usam o provider local e mocks, sem comprovar envio à rede.

O CI bloqueia alertas altos/críticos nas dependências de produção. `npm audit` completo também inclui ferramentas de build/teste; deve ser acompanhado separadamente. Avisos de peer dependencies do pacote transitivo Metaplex permanecem e não impedem `npm ci`.

## Validação local concluída

| Verificação | Resultado |
| --- | --- |
| Instalação limpa (`npm ci`) | Backend e frontend aprovados |
| Build e lint | Backend e frontend aprovados |
| Jest / serviços e guards | 22 suítes, 144 testes aprovados |
| Integração com PostgreSQL | 3 suítes, 17 testes aprovados |
| Vitest / React | 4 arquivos, 25 testes aprovados |
| Playwright / Chromium | 2 fluxos aprovados, incluindo viewport móvel, QR decodificado, PDF e demo sem API |
| Docker / Node 22 Alpine | Build aprovado com o lockfile final |
| Inicialização Docker com PostgreSQL vazio | 17 migrations, seed, aplicação e banco saudáveis; passaporte `AGP-2026-0002` encerrado com 7 eventos e cadeia íntegra |

Os containers do smoke test foram encerrados após a verificação. Nenhum banco de produção foi alterado.

## Pendências externas

- Provisionar hospedagem e PostgreSQL gerenciado, configurar os domínios e publicar o commit.
- Observar o CI remoto verde; os resultados locais não demonstram execução no GitHub.
- Verificar QR em celular físico e HTTPS, persistência após redeploy, backups e restauração.
- Configurar e divulgar somente credenciais da instância dedicada a dados fictícios.

Leia também as [limitações do produto](../README.md#limitações-conhecidas-e-roadmap) e o [guia de deploy](deploy.md).
