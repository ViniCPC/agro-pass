# Backend AgroPass

API NestJS com PostgreSQL/Prisma, JWT, eventos encadeados e passaportes públicos.

Consulte o [README principal](../README.md) para configuração, credenciais locais, endpoints e arquitetura; o [guia de deploy](../docs/deploy.md) descreve produção e variáveis.

```bash
npm ci
npm run build
npm run lint:check
npm test
npm run test:e2e:db:up
npm run test:e2e
```

O banco de teste usa a porta 55432 e é separado do desenvolvimento. O build gera o cliente Prisma. A produção inicia com `npm run start:prod`; o Docker também aplica migrations antes de iniciar.
