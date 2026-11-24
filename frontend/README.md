# Frontend AgroPass

Interface React/TypeScript para gestão de lotes, passaporte público e etiquetas QR.

Consulte o [README principal](../README.md) para executar o sistema e o [guia de deploy](../docs/deploy.md) para publicar.

```bash
npm ci
npm run lint
npm test
npm run build
npm run dev
```

Abra `/demo` para explorar sem API. O exemplo público está em `/trace/DEMO-2025-0001`.

Os testes Playwright (`npm run test:e2e`) usam os builds de produção, PostgreSQL exclusivo e seed. Prepare o ambiente conforme o README principal. O CI instala Chromium e executa o fluxo completo automaticamente.
