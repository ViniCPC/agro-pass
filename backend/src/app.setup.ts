import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { REQUEST_ID_HEADER } from './common/request-context.middleware';

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function isProduction(env: NodeJS.ProcessEnv) {
  return env.NODE_ENV === 'production';
}

// Allowed browser origins come from the environment. Localhost is only
// trusted outside production.
export function allowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = [
    env.PUBLIC_APP_URL,
    ...(env.CORS_ORIGINS ?? '').split(','),
  ]
    .map((origin) => {
      if (!origin?.trim()) return undefined;
      // PUBLIC_APP_URL may contain the GitHub Pages subpath. CORS uses origins.
      return new URL(origin.trim()).origin;
    })
    .filter((origin): origin is string => Boolean(origin));

  return [
    ...new Set([...(isProduction(env) ? [] : DEV_ORIGINS), ...configured]),
  ];
}

// JSON lines in production (or LOG_FORMAT=json) so platforms can index the
// fields; readable colored lines in development.
export function createLogger(env: NodeJS.ProcessEnv = process.env) {
  const json = env.LOG_FORMAT ? env.LOG_FORMAT === 'json' : isProduction(env);
  return new ConsoleLogger({ json, colors: !json });
}

function trustProxySetting(env: NodeJS.ProcessEnv) {
  const value = env.TRUST_PROXY ?? (isProduction(env) ? '1' : '');
  if (!value || value === 'false') return null;
  if (value === 'true') return true;
  return /^\d+$/.test(value) ? Number(value) : value;
}

// Shared by main.ts and the e2e tests, so tests exercise the real HTTP
// hardening instead of a parallel setup.
export function configureApp(
  app: NestExpressApplication,
  env: NodeJS.ProcessEnv = process.env,
) {
  // Behind a platform proxy the client IP comes from X-Forwarded-For; rate
  // limiting per client depends on it.
  const trustProxy = trustProxySetting(env);
  if (trustProxy !== null) app.set('trust proxy', trustProxy);

  // Public documents are opened from the frontend origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: allowedOrigins(env),
    credentials: false,
    exposedHeaders: [REQUEST_ID_HEADER],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AgroPass API')
    .setDescription('Passaporte digital de lotes agricolas.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  return app;
}
